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
        window.logger.log("Playground command result", output);
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

window.logger = new NestedLogger();
window.pState = new PlaygroundState();

function getBalanceByUserId(users: User[]) {
    // For each user in users, add an entry to the balanceByUserId dictionary
    let balanceByUserId: { [key: string]: number } = {};
    for (let user of users) {
        balanceByUserId[user.id] = user.balance;
    }
    return balanceByUserId;
}



function executeCommand(command: string): any {
    // Split into tokens
    const tokens: string[] = command.split(' ');
    // The first token is the command
    const commandName: string = tokens[0];
    // The rest of the tokens are the arguments
    const args: string[] = tokens.slice(1);

    // CREATE command
    if (commandName === 'CREATE') {
        // Use the defaults for now
        let market;
        try {
            market = window.pState.addContractWithDefaultProps()
        } catch (e) {
            console.log("Error creating contract");
            window.logger.log(e.message, e.stack.split('\n'));
            return e;
        }
        return market;
    }
    if (commandName === 'BUY') {

        // // This sets new liquidity and subsidy on the window.market (because of code I added in on-create-bet.ts)
        // onCreateBet(window.result.newBet, window.market, bettor);

        // // TODO where in manifold's code does it do this update (presumably to the DB, but still)?
        // window.market.pool = window.result.newPool;
        // window.market.p = window.result.newP;
        // window.market.prob = window.result.newBet.probAfter;

        // return window.result;
    }
    return `Unknown command ${commandName}`;
}