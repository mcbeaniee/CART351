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
    listURL = encodedURL.json()['collection']['items'][0] # convert the URL to JSON format and access the dictionary
    imgFromNasa = listURL['links'][0]['href'] # retrieves the image link in the dictionary
    description = listURL['data'][0]['description'] # retrieves description in the dictionary

    # replace the empty space to be url encoded
    imgFromNasa = imgFromNasa.replace(' ', '%20') 
    return render_template("t1.html",
            have_results = True, # jinja indicator for if the results have been returned
            description= description, # data item description of the image
            imgPath = imgFromNasa # image link from dictionary
        )

#*************************************************
# #Task-2: GET REQUEST
@app.route("/t2")
def t2():
     return render_template("t2.html")
#*************************************************
@app.route("/getSearchCriteria_adv")
def getSearchCriteria_adv():
    #fill me in :
    encodedImageLinks = [] # empty image link list
    formInput = (request.args.get("searchCriteria")) # requests input from the form URL
    imageURL = f"https://images-api.nasa.gov/search?q={formInput}&media_type=image" # format the string for the URL with the form input + API +media type
    encodedURL = requests.get(imageURL) # get the URL from the NASA API
    imageList = encodedURL.json()['collection']['items'] # convert the URL to JSON format and access the dictionary

    for image in imageList[:9]:
          singleImage = image['links'][0]['href'] # retrieves the image link in the dictionary
          singleImage = singleImage.replace(' ', '%20') # replace the empty space to be url encoded
          encodedImageLinks.append(singleImage) # append the image link to the list
    return render_template("t2.html",images=encodedImageLinks)
pass
#*************************************************

#run
app.run(debug=True)