import { getCpmmProbability } from './lib/manifold/common/src/calculate-cpmm';
import { getNewContract } from './lib/manifold/common/src/new-contract';
import { ContractDictionary } from './lib/manifold/common/src/playground/contracts';
import { Contract } from './lib/manifold/common/src/contract';
import { User } from './lib/manifold/common/src/user';


let submitFunction = function(event: JQuery.KeyUpEvent) {
    if (event.keyCode === 13) {
        const command: string = $(this).val() as string;
        const output: string = executeCommand(command);
        // Replace the output
        $(this).next().html(output);

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

let contract_dict: ContractDictionary = {};
// Test user
let user: User = {
    id: '1',
    createdTime: 0,
    name: 'Alice',
    username: 'alice',
    avatarUrl: '',
    balance: 1000,
    totalDeposits: 0,
    profitCached: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        allTime: 0
    },
    creatorTraders: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        allTime: 0
    },
    nextLoanCached: 0,
    streakForgiveness: 0
}



function executeCommand(command: string): string {
    // Split into tokens
    const tokens: string[] = command.split(' ');
    // The first token is the command
    const commandName: string = tokens[0];
    // The rest of the tokens are the arguments
    const args: string[] = tokens.slice(1);

    // CREATE command
    if (commandName === 'CREATE') {
        // Hard code the arguments for now
        const contract = getNewContract(
            '0x123', //id
            'changeme', //slug
            user,
            'Will we succeed?', //question
            'BINARY', //outcomeType
            'This is a description', //description
            0.5, //initialProb
            10, //ante
            undefined, //closeTime
            'public', //visibility
            false, //isTwitchContract
            undefined, //min
            undefined, //max
            undefined, //isLogScale
            undefined, //answers
            undefined, //addAnswersMode
            undefined, //shouldAnswersSumToOne
            undefined, //loverUserId1
            undefined //loverUserId2
        );

        return `Created contract ${contract.id}`;
    }
    return `Unknown command ${commandName}`;
}