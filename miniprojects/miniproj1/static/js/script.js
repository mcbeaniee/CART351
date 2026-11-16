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
let tempDeleteData = {};

let commandRepeat = `<span class='command'>${content.value}: </span><br>`;

// simulate enter key input submit, runs commands and resets input data
content.addEventListener('keydown', keypressHandler);

function runWelcomeCommandOnLoad(){
    displayCommand('welcome');
}

function ScrollToDirection(direction) {
    if (direction === 'top') {
        window.scrollTo(top, 0);
    }
    if (direction === 'bottom') {
        window.scrollTo(0, document.body.scrollHeight);
    }
}

function keypressHandler(event) {
    if (event.key !== 'Enter') return;
    // command from input, trimmed. if notthing, advance terminal
    const command = content.value.trim();
    if (!command) return;
    content.value = '';

    // runs user commands depending on if the terminal mode (for multi-step commands) is null or not
    if (terminalMode) {
        handleUserLogin(command);
        handleUserCreate(command);
        handleNoteCreate(command);
        handleNoteDelete(command);
        handleUserDelete(command);
        return;
    }

    // switch states for each command (better than if/else chains lol)
    // sets up terminalMode for login, create, and note functions
    switch (command) {
    case 'user login':
        if (currentUser) {
            displayOutput(`You are already logged into ${currentUser}.`);
        } else {
            terminalMode = 'LOGIN';
            displayCommand(command);
        }
        break;
    
    // resets all states on user logout
    case 'user logout':
        terminalMode = null;
        currentUser = null;
        displayCommand(command);
        break;
    
    // prompts terminalMode for user creation
    case 'user create':
        terminalMode = 'CREATE';
        displayCommand(command);
        break;

    case 'notes create':
        if (!currentUser) {
            displayOutput('Notes may only be created if you are logged in. Log in with <span class="command">user login</span> command.');
        } else {
            terminalMode = 'NOTETITLE';
            displayCommand(command);
        }
        break;
    
    case 'notes delete':
        if (!currentUser) {
            displayOutput('Not logged in. Log in with <span class="command">user login</span> command to delete notes.');
        } else {
            terminalMode = 'NOTEDELETE1';
            displayCommand(command);
        }
        break;

    case 'notes list':
        if (!currentUser) {
            displayOutput('Not logged in. Log in with <span class="command">user login</span> command to view notes.');
        } else {
            displayCommand(command);
            displayOutput(users[currentUser].notes.length > 0 ? 
                users[currentUser].notes.map(
                    note => `<span class='command'>${note.title}</span><br><span>${note.content}</span>`
                ).join('<br>') : 'No notes found.');
        }
        break;
    
    case `user list`:
        displayCommand(command);
        displayOutput(Object.keys(users).length > 0 ?
            Object.keys(users).map(username => `<span class='command'>${username}</span>`).join('<br>') : 'No users found.');
        break;
    
    case `user delete`:
        if (!currentUser) {
            displayCommand(command);
            terminalMode = 'DELETEUSER1';
        } else {
            displayOutput('You cannot delete a user while logged in. Log out with <span class="command">logout</span> command.');
        }
        break;
        
    default:
        displayCommand(command)
    }
}

// Search JSON file for commands depending on the input and display them using displayOutput
function displayCommand(command) {
    const commandRepeat = `<span class='command'>${command}: </span><br>`;

    // Check if the command is in the list of commands
    if (commands.some(cmd => cmd.name === command)&&!currentUser) {
        const cmd = commands.find(cmd => cmd.name === command);
        displayOutput(commandRepeat + cmd.content);
    } 
    // Check for Usercommands
    else if (userCommands.some(cmd => cmd.name === command)) {
        const cmd = userCommands.find(cmd => cmd.name === command);
        displayOutput(commandRepeat + cmd.content);
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
            displayOutput(`User '${input}' not found. Did you want to use <span class="command">user create</span>?`);
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
            displayOutput('Password incorrect.  ')
        }
        
        terminalMode = null;
        tempLoginData = {};
    }
}

function handleUserDelete(input){
    if (terminalMode === 'DELETEUSER1'){
        tempDeleteData.username = input;
        displayOutput(`Are you sure you want to delete user '${tempDeleteData.username}'? (y/n)`);
        terminalMode = 'DELETEUSER2';
    } else if (terminalMode === 'DELETEUSER2'){
        if (users[tempDeleteData.username] && input.toLowerCase() === 'y') {
            terminalMode = 'DELETEUSER3';
            displayOutput(`Enter password for user ${tempDeleteData.username}`)
        } else if (input.toLowerCase() === 'n') {
            displayOutput(`User deletion aborted.`);
            terminalMode = null;
        } else {
            displayOutput(`User '${tempDeleteData.username}' not found.`);
            terminalMode = null;
        }
    } else if (terminalMode === 'DELETEUSER3'){
        if (users[tempDeleteData.password] === input){
            delete users[tempDeleteData.username];
            displayOutput(`User '${tempDeleteData.username}' deleted.`);
            terminalMode = null;
        } // if password is incorrect, allow a retry
        else {
            displayOutput('Password incorrect.')
            terminalMode = null;
        }
    }
}

// async function (due to file changese) that fetches the route actions of main.py to append new users using inputs
async function handleUserCreate(input){
    if (terminalMode === 'CREATE'){
        // checks if input already exists in users json, prompting user login or a different username
        if (users[input]){
            displayOutput(`User ${input} already exists. Try <span class="command">user login</span> or choosing a different username.`)
            terminalMode = null;
            return;
        } else if (input==="abort"){
            displayOutput("<span class='command'>user create</span> command aborted.")
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

async function handleNoteDelete(input){
    if (terminalMode === 'NOTEDELETE1') {
    tempNoteData.title = input;
    terminalMode = 'NOTEDELETE2';
    displayOutput(`Are you sure you want to delete note '${tempNoteData.title}'? (y/n)`);
    return;
    } else if (terminalMode === 'NOTEDELETE2') {
        if (input.toLowerCase() === 'y') {
            terminalMode = 'NOTEDELETE3';
            displayOutput(`Note '${tempNoteData.title}' in user '${currentUser}' deleted.`);
        } else {
            displayOutput(`Note deletion aborted.`);
            terminalMode = null;
            tempNoteData = {};
        }
    } else if (terminalMode === 'NOTEDELETE3') {
        tempNoteData.content = input;

        delete users[currentUser].notes[tempNoteData.title];
        displayOutput(`Note '${tempNoteData.title}' in user '${currentUser}' deleted.`);

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

