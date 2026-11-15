var content = document.querySelector('#commandInput');
import data from '../assets/commands.json' with {type: 'json'};
import userData from '../assets/users.json' with {type: 'json'};

console.log(data);

// stores json data for users and commands
var users = userData.users
var userCommands = data.userCommandMessages;
var commands = data.menuCommandMessages;

// track current user and terminal mode for multi-step commands
let currentUser = null;
let terminalMode = null;

// temporary data for multi-step commands
let tempLoginData = {};
let tempCreateData = {};

// simulate enter key input submit, runs commands and resets input data
content.addEventListener('keydown', keypressHandler);

function keypressHandler(event) {
    if (event.key === 'Enter') {
        // command from input, trimmed. if notthing, advance terminal
        const command = content.value.trim();
        if (!command) return;
        content.value = '';

        // runs user commands depending on if the terminal mode (for multi-step commands) is null or not
        if (terminalMode){
            handleUserLogin(command);
            handleUserCreate(command);
            return;
        }

        // prime user login command, set terminal mode for handleUserLogin function
        if (command === 'user login'){
            if (!currentUser){
                terminalMode = 'LOGIN';
                displayCommand(command);
                console.log(terminalMode);
                return;
            } // handle edge case for user login command if already logged in
            else {
                displayOutput(`You are already logged into ${currentUser}.`);
            }
            
        }

        // exit user profile on logout command
        if (command === 'user logout'){
            terminalMode = null;
            currentUser = null;
            displayCommand(command)
            return;
        }

        // prime user create command, set terminal mode for handleUserCreate function
        if (command === 'user create'){
            terminalMode = 'CREATE';
            displayCommand(command)
            return;
        }
    }
}

// Search JSON file for commands depending on the input
function displayCommand(command) {
    // Check if the command is in the list of commands
    if (commands.some(cmd => cmd.name === command)) {
        const cmd = commands.find(cmd => cmd.name === command);
        displayOutput(cmd.content);
    } 
    // Check for Usercommands
    else if (userCommands.some(cmd => cmd.name === command)) {
        const cmd = userCommands.find(cmd => cmd.name === command);
        displayOutput(cmd.content);
    } 
    else {
        displayOutput(`Command not found: ${command}`);
    }
}

// multi-step command that checks users json for matching users and passwords once user is selected
function handleUserLogin(input){
    if (terminalMode === 'LOGIN'){
        // save temp data to use for password lookup
        if (users[input]) {
            tempLoginData.username = input;
            terminalMode = 'PASSWORD';
        displayOutput('<span>Enter user password: </span>');
        } // if user is not found, reset mode and prompt user create command
        else{
            displayOutput(`User '${input}' not found. Did you want to use <span>user create</span>?`);
            terminalMode = null;
        
        }
    } else if (terminalMode === 'PASSWORD'){
        // use temp data to lookup user in json
        const findUser = users[tempLoginData.username];
            
        if (findUser && findUser.password === input){
            currentUser = tempLoginData.username;
            displayOutput(`Now logged into <span>${currentUser}!</span>`);
        } // if password is incorrect, allow a retry
        else {
            displayOutput('Password incorrect. Try again.')
        }
        
        terminalMode = null;
        tempLoginData = {};
    }
}

// async function (due to file changese) that fetches the route actions of main.py to append new users using inputs
async function handleUserCreate(input){
    if (terminalMode === 'CREATE'){
        // checks if input already exists in users json, prompting user login or a different username
        if (users[input]){
            displayOutput(`User ${input} already exists. Try user login or choosing a different username.`)
            terminalMode = null;
            return;
        }

        tempCreateData.username = input;
        terminalMode = 'CREATEPASSWORD';
        displayOutput('<span>Create user password: </span>');
    } else if (terminalMode==='CREATEPASSWORD'){
        tempCreateData.password = input;

        try{
            const res = await fetch('/terminal',{
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    action: 'create_user',
                    username: tempCreateData.username,
                    password: tempCreateData.password
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                displayOutput(`<span>Error: ${errorText}</span>`);
                terminalMode = null;
                tempCreateData = {};
                return
            }

            const successMessage = await res.text();

            //users[tempCreateData.username] = {
            //    password: tempCreateData.password,
            //    notes: []
            //};
            currentUser = tempCreateData.username;
            displayOutput(successMessage);

        } catch (err){
            console.log(err);
            displayOutput(`Server error.`)
        }

        terminalMode = null;
        tempCreateData = {};
    }
}

function displayOutput(output) {
    const outputElement = document.createElement('p');
    outputElement.innerHTML = output;
    document.getElementById('output').appendChild(outputElement);
}

