import { User } from './lib/manifold/common/src/user';
import jsonview from '@pgrabovets/json-view';
import { NestedLogger } from './lib/manifold/common/src/playground/nested-logger';
import { PlaygroundState } from './lib/manifold/common/src/playground/playground-state';

let collapseWideTrees = function(tree: jsonview.TreeNode, width: number = 4) {
    for (let i = 0; i < tree.children.length; i++) {
        const child = tree.children[i];
        if (child.children.length >= width) {
            jsonview.collapse(child);
        } else {
            collapseWideTrees(child, width);
        }
    }

    // Now iterate through all children and expand-in-data the thin ones
    jsonview.traverse(tree, (node: jsonview.TreeNode) => {
        if (node.children.length < width /*&& (!node.parent || node.parent.children.length < width+5)*/) {
            node.isExpanded = true;
        }
    });
}

let submitFunction = function(event: JQuery.KeyUpEvent) {
    if (event.keyCode === 13) {
        const command: string = $(this).val() as string;
        const output = executeCommand(tokenize(command));
        window.jsonlog = jsonview.create(JSON.stringify(window.logger.getLog()));
        jsonview.render(window.jsonlog, $(this).siblings('.output-container')[0]);
        jsonview.expand(window.jsonlog);
        collapseWideTrees(window.jsonlog);

        // Hide the useless root element
        // $(this).siblings('.output-container').children('.json-container').children().first().addClass('hidden');


        // Create a new repl-container below, but only if we are the last repl-container
        if ($(this).parent().is(':last-child')) {
            const newReplContainer: JQuery<HTMLElement> = $('<div>').addClass('repl-container').html(`
                <input type="text" class="command-input">
                <div class="output-container"></div>
            `);
            $(this).parent().parent().append(newReplContainer);

            // Focus on the new command input
            const newCommandInput: JQuery<HTMLElement> = newReplContainer.find('.command-input');
            newCommandInput.focus();

            // Add the submitFunction event listener to the new command input
            newCommandInput.on('keyup', submitFunction);
        }
    }
}

// When a input.command-input is submitted, execute the command
// and display the output in div.output-container
$('.command-input').on('keyup', submitFunction);

declare global {
  interface Window {
    jsonlog: any;
    jsonview: jsonview;
    logger: NestedLogger;
    pState: PlaygroundState;
  }
}

window.jsonview = jsonview;

const commandsRequiringUser = [
    'CREATE',
    'BUY'
]

window.pState = new PlaygroundState();

function tokensToObject(tokens: string[]): any {
    console.log(`Tokens: ${tokens}`);
    const obj: any = {};
    const isKey: boolean = true;
    let key: string = '';
    tokens.forEach((token: string) => {
        if (key === '') {
            // Interpret the next token as a key
            if (token.includes(':')) throw new Error(`Bad colon placement`);
            key = token;
        } else {
            // Interpret the next token as a value
            if (token.includes(':')) return;
            obj[key] = token;
            key = '';
        }
    })
    if (key !== '') throw new Error(`Missing value for key ${key}`);
    return obj;
}

let recentUserId: string | undefined = undefined;
function getRecentUserId(): string {
    if (!recentUserId) {
        recentUserId = window.pState.getFirstUser().id;
    }
    return recentUserId;
}


function tokenize(command: string): string[] {
    // Tokens are separated by spaces, commas, or colons (counts as a token)
    // If there are double or single quotes, then the quotes are removed and the contents are a single token
    // Remove all non-quoted whitespace, and all other characters that aren't quotes, spaces, commas, colons, or alphanumeric
    let tokens: string[] = [];
    let currentToken: string = '';
    let inQuotes: boolean = false;
    let inDoubleQuotes: boolean = false;
    let pushToken = function() {
        if (currentToken.length > 0) {
            tokens.push(currentToken);
            currentToken = '';
        }
    }
    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        if (char === ' ' || char === ',' || char === ':') {
            if (!inQuotes && !inDoubleQuotes) {
                pushToken();
                if (char === ':') {
                    tokens.push(':');
                }
                continue;
            }
        }
        if (char === '"') {
            if (inDoubleQuotes) {
                pushToken();
                inDoubleQuotes = false;
                continue;
            } else if (!inQuotes) {
                pushToken();
                inDoubleQuotes = true;
                continue;
            }
        }
        if (char === '\'') {
            if (inQuotes) {
                pushToken();
                inQuotes = false;
                continue;
            } else if (!inDoubleQuotes) {
                pushToken();
                inQuotes = true;
                continue;
            }
        }
        currentToken += char;
    }
    if (currentToken.length > 0) {
        tokens.push(currentToken);
    }
    return tokens;
}

function executeCommand(tokens: string[], userId?: string): any {

    // New sets of logs to generate (Should we be saving past ones?)
    window.logger = new NestedLogger();

    // Split into tokens
    if (tokens.length === 0) {
        return;
    }

    const commandName: string = tokens[0].toUpperCase();
    // Check if commandName in commandsRequiringUser and if userId is specified
    if (commandsRequiringUser.includes(commandName) && !userId) {
        window.logger.pLog("userId unspecified, using a default")
        window.logger.in()
        userId = getRecentUserId();
        window.logger.out(0)
    }

    // The rest of the tokens are the arguments
    const args: string[] = tokens.slice(1);

    // CREATE command
    if (commandName === 'CREATE') {
        // Use the defaults for now
        let market;
        try {
            if (!window.pState.getUser(userId)) window.pState.addUserWithDefaultProps({id: userId});
            recentUserId = userId;
            // Interpret args after the command
            market = window.pState.addContractWithDefaultProps(userId, tokensToObject(args));
            return market;
        } catch (e) {
            console.log("Error creating contract");
            window.logger.pLog(e.message, e.stack.split('\n'));
            return e;
        }
    }
    if (commandName === 'BUY') {
        try {
            if (!window.pState.getUser(userId)) window.pState.addUserWithDefaultProps({id: userId});
            recentUserId = userId;
            const bet = window.pState.placeBetWithDefaultProps({}, userId, false);
            return bet
        } catch (e) {
            console.log("Error placing bet");
            window.logger.pLog(e.message, e.stack.split('\n'));
            return e;
        }
    }

    // No commands matched. If we weren't passed a userId, rerun without the first token
    if (!userId) {
        userId = tokens[0];
        window.logger.pLog(`Unknown command, parsing ${userId} as userId`)
        return executeCommand(tokens.slice(1), userId);
    } else {
        console.error(`Unknown command ${commandName}`)
        return window.logger.pLog(`Unknown command ${commandName}`)
    }
}