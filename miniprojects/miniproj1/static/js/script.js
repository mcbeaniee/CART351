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
let tempNoteData = {};

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
            handleNoteCreate(command);
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

        if (command === 'notes create'){
            if (!currentUser){
                displayOutput('Notes may only be created if you are logged in. Log in with user login command.')
            } else{
                terminalMode = 'NOTETITLE'
                displayCommand(command)
                return;
            }
        }
    }
}

// Search JSON file for commands depending on the input and display them using displayOutput
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
        } else if (input==="abort"){
            displayOutput("User create command aborted.")
            terminalMode = null;
            return;
        }

        // saves input for temp data, as all data will be passed to the python only once a password is chosen
        tempCreateData.username = input;
        terminalMode = 'CREATEPASSWORD';
        displayOutput('<span>Create user password: </span>');
    } else if (terminalMode==='CREATEPASSWORD'){
        tempCreateData.password = input;

        // fetch terminal route and try create_user action with username and password (note data is blank and created in the python route)
        if (input==="abort"){
            displayOutput("User create command aborted.")
            terminalMode = null;
            return;
        } else {
            try{
                const res = await fetch('/terminal',{
                    method: 'POST',
                    // wouldn't work without this header, for whatever reason
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        action: 'create_user',
                        username: tempCreateData.username,
                        password: tempCreateData.password
                    })
                });
                
                // non-server error handler
                if (!res.ok) {
                    const errorText = await res.text();
                    displayOutput(`<span>Error: ${errorText}</span>`);
                    terminalMode = null;
                    tempCreateData = {};
                    return
                }

                // pull success message from response and output it 
                const successMessage = await res.text();

                //users[tempCreateData.username] = {
                //    password: tempCreateData.password,
                //    notes: []
                //}; unneeded since python creates blank note data
                currentUser = tempCreateData.username;
                displayOutput(successMessage);
            
            // server error handler
            } catch (err){
                console.log(err);
                displayOutput(`Server error.`)
            }
    
            // reset modes after sending data to json
            terminalMode = null;
            tempCreateData = {};
        }
    }
}

async function handleNoteCreate(input){
    if (terminalMode === 'NOTETITLE') {
    tempNoteData.title = input;
    terminalMode = 'NOTECONTENT';
    displayOutput('Enter note content:');
    return;
    } 
    else if (terminalMode === 'NOTECONTENT') {
        tempNoteData.content = input;

        try {
            const res = await fetch('/terminal', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    action: 'create_note',
                    username: currentUser,
                    title: tempNoteData.title,
                    content: tempNoteData.content
                })
            });

            // non-server error handler
            if (!res.ok) {
                const errorText = await res.text();
                displayOutput(`<span>Error: ${errorText}</span>`);
                terminalMode = null;
                tempCreateData = {};
                return
            } 

            // pull success message from response and output it 
            const successMessage = await res.text();
            displayOutput(successMessage);
        
        // server error handler
        } catch (err){
            console.log(err);
            displayOutput(`Server error.`)
        }

        // reset modes after sending data to json
        terminalMode = null;
        tempCreateData = {};
    }
}

// get document element for terminal and add inputs to it
function displayOutput(output) {
    const outputElement = document.createElement('p');
    outputElement.innerHTML = output;
    document.getElementById('output').appendChild(outputElement);
}

