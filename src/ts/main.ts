import { CpmmState, getCpmmProbability } from './lib/manifold/common/src/calculate-cpmm';
import { getNewContract } from './lib/manifold/common/src/new-contract';
import { ContractDictionary } from './lib/manifold/common/src/playground/contracts';
import { BinaryContract, CPMM, CPMMBinaryContract, Contract } from './lib/manifold/common/src/contract';
import { User } from './lib/manifold/common/src/user';
import { getDisplayProbability } from './lib/manifold/common/src/calculate';
import { computeCpmmBet, getBinaryCpmmBetInfo } from './lib/manifold/common/src/new-bet';
import { LimitBet } from './lib/manifold/common/src/bet';


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

declare global {
  interface Window {
    market: CPMMBinaryContract;
    contract_dict: ContractDictionary;
    users: User[];
  }
}

window.contract_dict = {} as ContractDictionary
window.market = undefined as BinaryContract & CPMM
window.users = [{
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
}] as User[]

function getBalanceByUserId(users: User[]) {
    // For each user in users, add an entry to the balanceByUserId dictionary
    let balanceByUserId: { [key: string]: number } = {};
    for (let user of users) {
        balanceByUserId[user.id] = user.balance;
    }
    return balanceByUserId;
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
        window.market = getNewContract(
            '0x123', //id
            'changeme', //slug
            window.users[0],
            'Will we succeed?', //question
            'BINARY', //outcomeType
            'This is a description', //description
            50, //initialProb, out of 100
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
        ) as CPMMBinaryContract

        return `Created contract ${window.market.id} at probability ${getDisplayProbability(window.market)}`;
    }
    if (commandName === 'BUY') {
        // Hard code the arguments for now
        let betAmount = parseInt(args[0]) as number;
        let outcome = args[1].toUpperCase() as 'YES' | 'NO';
        // TODO should we use:
        //  getBinaryCpmmBetInfo
        //   calls computeCpmmBet
        //   calls computeFills
        //   calls computeFill
        //   calls calculateCpmmPurchase
        //
        // or should we call one of the ones lower in the chain? I wish I could
        // find how Manifold updates their db with new bets.
        let result = getBinaryCpmmBetInfo(
            window.market,
            // Upper case outcome
            outcome,
            betAmount as number,
            undefined,
            [] as LimitBet[],
            getBalanceByUserId(window.users),
            undefined,
        );

        // TODO this doesn't cover things like liquidity and bonuses. Adapt on-create-bets.ts in the backend to actually capture all the nuanced logic
        window.market.pool = result.newPool;
        window.market.p = result.newP;

        return `Bought ${betAmount} for outcome ${outcome}. Result: ${JSON.stringify(result)}`;
    }
    return `Unknown command ${commandName}`;
}