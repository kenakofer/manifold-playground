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

function executeCommand(command: string): string {
    // TODO: Implement command execution logic
    return `Output for command "${command}"`;
}