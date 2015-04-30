var http = require('http');
var cheerio = require('cheerio');
var moment = require('moment');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var STATUS_CODES = http.STATUS_CODES;
/*
 * Scraper Constructor
**/
function Scraper (url) {
    this.index = 0;
    this.url = url;
    this.urls = [];
    this.init();
}
/*
 * Make it an EventEmitter
**/
util.inherits(Scraper, EventEmitter);

/*
 * Initialize scraping
**/
Scraper.prototype.init = function () {
    var self = this;
    self.models = [];

    self.on('loadedPilotPage', function (html) {
        self.urls = self.parseLeaguePage(html);
        console.log("urls[index]: ", self.urls[this.index]);
        self.url = 'http://www.xcleague.com' + self.urls[this.index];
        self.loadPage('loadedFlightPage');
    });

    self.on('loadedFlightPage', function (html) {
        var nextUrl = self.parseFlightPage(html);
        if(nextUrl !== undefined && nextUrl !== 'undefined'){
          console.log("loadedFlightPage: ", nextUrl);
          self.url = 'http://www.xcleague.com' + nextUrl;
          self.loadPage('loadedFlightPage');
        }else{
          if(this.index < self.urls.length - 1){
            this.index ++;
            self.url = 'http://www.xcleague.com' + self.urls[this.index];
            console.log("index: ", self.url);
            self.loadPage('loadedFlightPage');
          }else{
            self.emit('complete', self.models);
          }
        }
    });

    self.loadPage('loadedPilotPage');
};

Scraper.prototype.resume = function() {
  this.emit('loadedFlightPage');
}

Scraper.prototype.loadPage = function (eventName) {
  var self = this;
  console.log('\n\nLoading: ', self.url);
  http.get(self.url, function (res) {
    var body = '';
    if(res.statusCode !== 200) {
      return self.emit('error', STATUS_CODES[res.statusCode]);
    }
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      self.emit(eventName, body);
    });
  })
  .on('error', function (err) {
    self.emit('error', err);
  });      
};

/*
 * Parse html and return an object
**/
Scraper.prototype.parseLeaguePage = function (html) {
  var $ = cheerio.load(html);
  var table = $('#leagueTable');

  // for testing use one entry
  // var rows = table.find('tr').eq(50);

  // production use all entries
  var rows = table.find('tr');
  var flights = [];

  rows.each(function(index, el){
  	var row = $(el);
  	var tds = row.find('td');
    var flight = tds.eq(6).find('a').eq('1').attr('href');
    
    if(flight !== undefined){
      console.log("flight: ", flight);
      flights.push(flight);
    }
  });

  return flights;
};

Scraper.prototype.parseFlightPage = function(html){
  if(html === undefined){
    console.log("return")
    return undefined;
  }
  console.log("call to parse")
  var self = this;
  var $ = cheerio.load(html);

  $('#coordinates').remove();

  var pilot = $('#hpTitle').html().replace(/\n|<span.*<\/span>/gi, "");
  var title = $('.vfFlightText').text();

  var club, glider, date, start, finish, duration, takeoff, landing, total, multiplier, score;

  $('.viewRow').each(function(index, el){
    var $el = $(el);
    var label = $el.find('.viewLabel').text();
    var text = $el.find('.viewText').text();

    switch(label){
      case 'Club':
        club = text;
      break;

      case 'Glider':
        glider = text;
      break;

      case 'Date':
        date = text;
      break;

      case 'Start':
        start = text;
      break;

      case 'Finish':
        finish = text;
      break;

      case 'Duration':
        duration = text;
      break;

      case 'Takeoff':
        takeoff = text;
      break;

      case 'Landing':
        landing = text;
      break;

      case 'Total':
        total = text;
      break;

      case 'Multiplier':
        multiplier = text;
      break;

      case 'Score':
        score = text;
      break;
    }
  });

  // get stats from panel
  var stats = $('#xcTab-stats-content');
  var maxHeight = stats.find('#xcTab-stats-height-max').text();
  var lowHeight = stats.find('#xcTab-stats-height-low').text();
  var teakeoffHeight = stats.find('#xcTab-stats-height-ta').text();
  var maxClimb = stats.find('#xcTab-stats-climb-max').text();
  var minClimb = stats.find('#xcTab-stats-climb-min').text();
  var maxSpeed = stats.find('#xcTab-stats-speed-max').text();
  var avgSpeedCourse = stats.find('#xcTab-stats-speed-avgCourse').text();
  var avgSpeedTrack = stats.find('#xcTab-stats-speed-avgCourse').text();

  var model = {
    pilot: pilot,
    title: title,
    club: club,
    glider: glider,
    date: moment(date, 'DD MMM YYYY'),
    start: start,
    finish: finish,
    duration: duration,
    takeoff: takeoff,
    landing: landing,
    total: total,
    multiplier: multiplier,
    score: score,
    maxHeight: maxHeight,
    lowHeight: lowHeight,
    takeoffHeight: teakeoffHeight,
    maxClimb: maxClimb,
    minClimb: minClimb,
    maxSpeed: maxSpeed,
    avgSpeedCourse: avgSpeedCourse,
    avgSpeedTrack: avgSpeedTrack
  }

  self.models.push(model);

  var nextUrl = $('.navNext a').attr('href');
  if(nextUrl !== 'undefined' && nextUrl !== undefined){
    console.log("nextUrl: ", nextUrl);
    return nextUrl;
  }else{
    console.log("no more urls");
  }
}

module.exports = Scraper;