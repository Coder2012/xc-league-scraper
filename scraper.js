var http = require('http');
var cheerio = require('cheerio');
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
        // self.emit('complete', model);
    });

    function loadNextFlight(){

    }

    self.on('loadedFlightPage', function (html) {
        var nextUrl = self.parseFlightPage(html);
        if(nextUrl !== undefined && nextUrl !== 'undefined'){
          console.log("loadedFlightPage: ", nextUrl);
          self.url = 'http://www.xcleague.com' + nextUrl;
          self.loadPage('loadedFlightPage');
          // self.emit('complete', model);
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
  var rows = table.find('tr').eq(1);
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
  var self = this;
  var $ = cheerio.load(html);

  $('#coordinates').remove();

  var pilot = $('#hpTitle').html().replace(/\n|<span.*<\/span>/gi, "");
  var title = $('.vfFlightText').text();

  var club, glider, date, start, finish, duration, takeoff, landing, total, multiplier, score;
  // var club = $('.viewRow .viewText').eq(0).text();
  // var glider = $('.viewRow .viewText').eq(1).text();
  // var date = $('.viewRow .viewText').eq(2).text();
  // var start = $('.viewRow .viewText').eq(3).text();
  // var finish = $('.viewRow .viewText').eq(4).text();
  // var duration = $('.viewRow .viewText').eq(5).text();
  // var takeoff = $('.viewRow .viewText').eq(6).text();
  // var landing = $('.viewRow .viewText').eq(7).text();

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
  })
  // var distance = $('.viewRow').eq(8).text();
  // var total = $('.viewRow').eq(9).text();
  // var multiplier = $('.viewRow').eq(10).text();
  // var score = $('.viewRow').eq(11).text();
  var model = {
    pilot: pilot,
    title: title,
    club: club,
    glider: glider,
    date: date,
    start: start,
    finish: finish,
    duration: duration,
    takeoff: takeoff,
    landing: landing,
    total: total,
    multiplier: multiplier,
    score: score
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