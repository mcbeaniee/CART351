import json
import os
from flask import Flask,render_template,request
app = Flask(__name__)

# load users json
userFile = os.path.join(app.root_path, 'static', 'assets', 'users.json')

# function to load users json for editing and reading (from os)
def loadUsers():
    if not os.path.exists(userFile):
        return {'users':{}}

    with open(userFile, 'r') as u:
        return json.load(u)

# function to update/change users json (added indent because every time json file was updated it would be one long string)
def saveUsers(data):
    os.makedirs(os.path.dirname(userFile), exist_ok=True) # this line is ripped from somewhere, i did not know how to do this innately. NOT AI!

    with open(userFile, "w") as u:
        json.dump(data,u,indent=4)

# index route - possibly not needed?
@app.route('/')
def index():
    return render_template("index.html")

# terminal route
@app.route('/terminal', methods=['POST'])
def terminal():
    requestData = request.get_json()
    action = requestData.get('action')
    username = requestData.get('username')

    userData = loadUsers()

    # 1. USER CREATE action, requests data from json and input from js
    if action == 'create_user':
        password = requestData.get("password")

        # pass new data to user json using saveUsers function
        userData["users"][username] = {"password": password, "notes": []}
        saveUsers(userData)

        # return message to be displayed in the output by js
        return 'User registered and logged in.'

    # 2. NOTECREATE action, requests data from json and adds notes to the current user's file
    if action == 'create_note':
        notesTitle = requestData.get("title")
        notesContent = requestData.get("content")

        # check if note content or title is empty
        if not notesTitle or not notesContent:
            return "Note cannot be empty or have no title."

        # append new note from input to user's file and save the file
        newNote = {"title": notesTitle, "content": notesContent}
        userData["users"][username]["notes"].append(newNote)
        saveUsers(userData)

        # return success message to awaiting js script
        return f'Note "{notesTitle}" successfully created.'
app.run(debug = True)