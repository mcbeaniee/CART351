import json
import os
from flask import Flask,render_template,request
app = Flask(__name__)

userFile = os.path.join(app.root_path, 'static', 'assets', 'users.json')

def loadUsers():
    if not os.path.exists(userFile):
        return {'users':{}}

    with open(userFile, 'r') as u:
        return json.load(u)

def saveUsers(data):
    os.makedirs(os.path.dirname(userFile), exist_ok=True)

    with open(userFile, "w") as u:
        json.dump(data,u)

# index route
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

    if action == 'create_user':
        password = requestData.get("password")

    userData["users"][username] = {"password": password, "notes": []}
    saveUsers(userData)

    return 'User registered.'

app.run(debug = True)