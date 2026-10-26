from flask import Flask

app = Flask(__name__)

@app.route("/")
def index():
    return 'six seven!'

@app.route("/about")
def about():
    return '<h1 style = "color:purple"> About Cart 351!</h1>'

@app.route("/cat/<name>")
def user_profile(name):
    if name

app.run()