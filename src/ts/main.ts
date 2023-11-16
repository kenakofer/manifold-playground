import { User } from './lib/manifold/common/src/user';
import jsonview from '@pgrabovets/json-view';
import { NestedLogger } from './lib/manifold/common/src/playground/nested-logger';
import { PlaygroundState } from './lib/manifold/common/src/playground/playground-state';

let collapseWideTrees = function(tree: jsonview.TreeNode, width: number = 3) {
    for (let i = 0; i < tree.children.length; i++) {
        const child = tree.children[i];
        if (child.children.length >= width) {
            jsonview.collapse(child);
        } else {
            collapseWideTrees(child, width);
        }
    }
}

let submitFunction = function(event: JQuery.KeyUpEvent) {
    if (event.keyCode === 13) {
        const command: string = $(this).val() as string;
        const output = executeCommand(command);
        const tree = jsonview.create(JSON.stringify(window.logger.getLog()));
        jsonview.render(tree, $(this).siblings('.output-container')[0]);
        jsonview.expand(tree);
        collapseWideTrees(tree, 5);

        // Hide the useless root element
        $(this).siblings('.output-container').children('.json-container').children().first().addClass('hidden');


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
    logger: NestedLogger;
    pState: PlaygroundState;
  }
}

const commandsRequiringUser = [
    'CREATE',
    'BUY'
]

window.pState = new PlaygroundState();

let recentUserId: string | undefined = undefined;
function getRecentUserId(): string {
    if (!recentUserId) {
        recentUserId = window.pState.getFirstUser().id;
    }
    return recentUserId;
}

function executeCommand(command: string, userId?: string): any {

    // New sets of logs to generate (Should we be saving past ones?)
    window.logger = new NestedLogger();

    // Split into tokens
    const tokens: string[] = command.split(' ');
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
            market = window.pState.addContractWithDefaultProps(userId, {})
            return market;
        } catch (e) {
            console.log("Error creating contract");
            window.logger.pLog(e.message, e.stack.split('\n'));
            return e;
        }
    }
    if (commandName === 'BUY') {
        try {
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
        const newCommand = args.join(' ');
        return executeCommand(newCommand, userId);
    } else {
        console.error(`Unknown command ${commandName}`)
        return window.logger.pLog(`Unknown command ${commandName}`)
    }
}