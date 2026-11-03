from flask import Flask, json,render_template,request,redirect,url_for
import requests
app = Flask(__name__)


# the default route
@app.route("/")
def index():
      return render_template("index.html")

#*************************************************
#Task-1: GET REQUEST
@app.route("/t1")
def t1():
     return render_template("t1.html",have_results=False)
#*************************************************
@app.route("/getSearchCriteria")
def getSearchCriteria():
    #fill me in :
    formInput = (request.args.get("searchCriteria")) # requests input from the form URL
    imageURL = f"https://images-api.nasa.gov/search?q={formInput}&media_type=image" # format the string for the URL with the form input + API +media type
    encodedURL = requests.get(imageURL) # get the URL from the NASA API
    imgFromNasa = encodedURL.json() # convert URL into JSON
    
    #imgFromNasa = imgFromNasa.replace(' ', '%20') # replace the empty space to be url encoded
    #it works just fine without this line above, but when uncommented it breaks? i'm not sure exactly why. i think it has something to do with the 
    #.replace method attempting to change string parameters of the JSON.

    return render_template("t1.html",
            have_results = True,
            description= imgFromNasa['collection']['items'][0]['data'][0]['description'],
            imgPath = imgFromNasa['collection']['items'][0]['links'][0]['href']     
        )
    pass

#*************************************************
# #Task-2: GET REQUEST
# @app.route("/t2")
# def t2():
#     return render_template("t2.html")
#*************************************************
@app.route("/getSearchCriteria_adv")
def getSearchCriteria_adv():
 #fill me in :
#  return render_template("t2.html",images=encodedImageLinks)
    pass
#*************************************************

#run
app.run(debug=True)