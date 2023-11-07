import { CpmmState, getCpmmProbability } from './lib/manifold/common/src/calculate-cpmm';
import { getNewContract } from './lib/manifold/common/src/new-contract';
import { ContractDictionary } from './lib/manifold/common/src/playground/contracts';
import { BinaryContract, CPMM, CPMMBinaryContract, Contract } from './lib/manifold/common/src/contract';
import { User } from './lib/manifold/common/src/user';
import { getDisplayProbability } from './lib/manifold/common/src/calculate';
import { computeCpmmBet, getBinaryCpmmBetInfo } from './lib/manifold/common/src/new-bet';
import { LimitBet } from './lib/manifold/common/src/bet';
import { onCreateBet } from './lib/manifold/common/src/trigger/on-create-bet';
import jsonview from '@pgrabovets/json-view';


let submitFunction = function(event: JQuery.KeyUpEvent) {
    if (event.keyCode === 13) {
        const command: string = $(this).val() as string;
        const output = executeCommand(command);
        const tree = jsonview.create(JSON.stringify(output));
        jsonview.render(tree, $(this).siblings('.output-container')[0]);


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
    result: any;
  }
}

window.result = {} as any
window.contract_dict = {} as ContractDictionary
window.market = undefined as BinaryContract & CPMM
const user_default_params = {
    id: '0',
    createdTime: 0,
    name: 'Andrew',
    username: 'andrew',
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
window.users = [
    user_default_params,
    {
    ...user_default_params,
    id: '1',
    name: 'BTE',
    username: 'bte',
    },
    {
    ...user_default_params,
    id: '2',
    name: 'Conflux',
    username: 'conflux',
    },
    {
    ...user_default_params,
    id: '3',
    name: 'Destiny',
    username: 'destiny',
    },
    {
    ...user_default_params,
    id: '4',
    name: 'Eliza',
    username: 'eliza',
    },
] as User[]

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
        // Hard code the arguments for now
        window.market = getNewContract(
            '0x123', //id
            'changeme', //slug
            window.users[0],
            'Will we succeed?', //question
            'BINARY', //outcomeType
            'This is a description', //description
            50, //initialProb, out of 100
            50, //ante, on manifold I think this is the 50 you pay for market creation. The pool in a binary market will be { YES: ante, NO: ante }
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

        return window.market;
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

        // IIUC, getBinaryCpmmBetInfo does all the user-agnostic math about the bet.
        let bettor = window.users[1];
        window.result = getBinaryCpmmBetInfo(
            window.market,
            // Upper case outcome
            outcome,
            betAmount as number,
            undefined,
            [] as LimitBet[],
            getBalanceByUserId(window.users),
            bettor,
            undefined,
        );

        // This sets new liquidity and subsidy on the window.market (because of code I added in on-create-bet.ts)
        onCreateBet(window.result.newBet, window.market, bettor);

        // TODO where in manifold's code does it do this update (presumably to the DB, but still)?
        window.market.pool = window.result.newPool;
        window.market.p = window.result.newP;
        window.market.prob = window.result.newBet.probAfter;

        return window.result;
    }
    return `Unknown command ${commandName}`;
}