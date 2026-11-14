var content = document.querySelector('#commandInput');
import data from '../assets/commands.json' with {type: 'json'};
console.log(data);
var userCommands = data.userCommandMessages;
var commands = data.menuCommandMessages;

function displayCommand(command) {
    // Check if the command is in the list of commands
    if (commands.some(cmd => cmd.name === command)) {
        const cmd = commands.find(cmd => cmd.name === command);
        displayOutput(cmd.content);
    } else if (userCommands.some(cmd => cmd.name === command)) {
        const cmd = userCommands.find(cmd => cmd.name === command);
        displayOutput(cmd.content);
    } else {
        displayOutput(`Command not found: ${command}`);
    }
}

function displayOutput(output) {
    const outputElement = document.createElement('p');
    outputElement.innerHTML = output;
    document.getElementById('output').appendChild(outputElement);
}

content.addEventListener('keydown', keypressHandler);

function keypressHandler(event) {
    if (event.key === 'Enter') {
        const command = content.value.trim();
        displayCommand(command);
        content.value = '';
    }
}