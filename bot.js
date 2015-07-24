//var Model = require('./model');
var Scraper = require('./scraper');
var Pages = [];
var domain = 'http://www.xcleague.com';
var flightUrls = [];

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/reactor');
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

var FlightSchema = new mongoose.Schema({
  _id: String,
  pilot: String,
  title: String,
  club: String,
  glider: String,
  date: Object,
  start: String,
  finish: String,
  duration: String,
  takeoff: String,
  landing: String,
  total: String,
  multiplier: String,
  score: String,
  maxHeight: String,
  lowHeight: String,
  takeoffHeight: String,
  maxClimb: String,
  minClimb: String,
  maxSpeed: String,
  avgSpeedCourse: String,
  avgSpeedTrack: String
});



var UserModel = mongoose.model('flights', FlightSchema);

FlightSchema.pre('save', function(next){
  var id = this.pilot + this.start + this.finish;
  this._id = id.replace(/ /g, '');

    UserModel.find({_id : this._id}, function (err, docs) {
        if (!docs.length){
            next();
        }else{                
            console.log('id exists: ', id);
            next(new Error());
        }
    });
  // next();
});

function generateUrls(limit) {
  // test url for errors
  //http://www.xcleague.com/xc/flights/20142100.html?vx=0111
  //http://www.xcleague.com/xc/leagues/latest.html
  //http://www.xcleague.com/xc/leagues/all-1.html
  var url = domain + '/xc/leagues/latest.html';
  var urls= [url];

  return urls;
}

// store all urls in a global variable  
Pages = generateUrls();

function scrapePilots() {
  // if the Pages array is empty, we are Done!!
  if (!Pages.length) {
    return console.log('Done!!!!');
  }
  var url = Pages.pop();
  var scraper = new Scraper(url);
  var model;
  console.log('Requests Left: ' + Pages.length);
  // if the error occurs we still want to create our
  // next request
  scraper.on('error', function (error) {
    console.log('bot error received from Scraper: ', error);
    scraper.resume();
  });
  // if the request completed successfully
  // we want to store the results in our database

  scraper.on('complete', function (models) {
    
    for (var i = 0; i < models.length; i++) {
      model = new UserModel(models[i]);

      var id = model.pilot + model.start + model.finish;
      id = id.replace(/ /g, '');
      model._id = id;

      model.save(function(err) {
        if (err) {
          console.log('Database err saving: ' + url);
        }
      });

    };
    console.log("all models saved to MongoDB");

  });
}

scrapePilots();