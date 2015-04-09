var http = require('http');
var cheerio = require('cheerio');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var STATUS_CODES = http.STATUS_CODES;
/*
 * Scraper Constructor
**/
function Scraper (url) {
    this.url = url;
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
    var model;
    var self = this;
    self.on('loaded', function (html) {
        model = self.parsePilotPage(html);
        self.emit('complete', model);
    });

    self.loadPilotPage();
};

Scraper.prototype.loadPilotPage = function () {
  var self = this;
  console.log('\n\nLoading pilot ');
  http.get(self.url, function (res) {
    var body = '';
    if(res.statusCode !== 200) {
      return self.emit('error', STATUS_CODES[res.statusCode]);
    }
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      self.emit('loaded', body);
    });
  })
  .on('error', function (err) {
    self.emit('error', err);
  });      
};

/*
 * Parse html and return an object
**/
Scraper.prototype.parsePilotPage = function (html) {
  var $ = cheerio.load(html);
  var models = [];
  var table = $('#leagueTable');

  var rows = table.find('tr');
  console.log(rows.length);

  rows.each(function(index, el){
  	var row = $(el);
  	var tds = row.find('td');
  	var pilot = tds.eq(1).text();
  	var club = tds.eq(2).text();
  	var glider = tds.eq(3).text();
  	var total = tds.eq(4).text();
  	var flight1 = tds.eq(6).find('a').eq('1').attr('href');
  	var flight2 = tds.eq(7).find('a').eq('1').attr('href');
  	var flight3 = tds.eq(8).find('a').eq('1').attr('href');
  	var flight4 = tds.eq(9).find('a').eq('1').attr('href');
  	var flight5 = tds.eq(10).find('a').eq('1').attr('href');
  	var flight6 = tds.eq(11).find('a').eq('1').attr('href');
  	var flights = [
        flight1,
  			flight2,
  			flight3,
  			flight4,
  			flight5,
  			flight6
  		];

  	var model = {
  		pilot: pilot,
  		club: club,
  		glider: glider,
  		total: total,
  		flightUrls: flights
  	};

  	models.push(model);

  });
  return models;
};

module.exports = Scraper;