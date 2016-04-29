var http = require('http');
var cheerio = require('cheerio');
var moment = require('moment');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var STATUS_CODES = http.STATUS_CODES;
var domain = 'http://www.xcleague.com';
var regex = /\d+/g;
var id;

function Scraper(url) {
    this.index = 0;
    this.url = url;
    this.urls = [];
    this.init();
}

util.inherits(Scraper, EventEmitter);

Scraper.prototype.init = function() {
    var self = this;
    self.models = [];

    self.on('loadedPilotPage', function(html) {
        self.urls = self.parseLeaguePage(html);
        self.url = domain + self.urls[this.index];
        self.loadPage('loadedFlightPage');
    });

    self.on('loadedFlightPage', function(html) {
        var nextUrl = self.parseFlightPage(html);
        if (nextUrl !== undefined && nextUrl !== 'undefined') {
            console.log("loadedFlightPage: ", nextUrl);
            self.url = domain + nextUrl;
            self.loadPage('loadedFlightPage');
        } else {
            if (this.index < self.urls.length - 1) {
                this.index++;
                self.url = domain + self.urls[this.index];
                self.loadPage('loadedFlightPage');
            } else {
                self.emit('complete', self.models);
            }
        }
    });

    self.loadPage('loadedPilotPage');
};

Scraper.prototype.resume = function() {
    this.emit('loadedFlightPage');
}

Scraper.prototype.loadPage = function(eventName) {
    var self = this;
    id = self.url.match(regex)[0];
    console.log('\n\nLoading: ', self.url);
    console.log("id: ", id);
    
    http.get(self.url, function(res) {
        var body = '';
        if (res.statusCode !== 200) {
            return self.emit('error', STATUS_CODES[res.statusCode]);
        }
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            self.emit(eventName, body);
        });
    })
    .on('error', function(err) {
        self.emit('error', err);
    });
};

Scraper.prototype.parseLeaguePage = function(html) {
    var $ = cheerio.load(html);
    var table = $('#leagueTable');

    // for testing use one entry
    // var rows = table.find('tr').eq(399);

    var rows = table.find('tr');
    var flights = [];

    rows.each(function(index, el) {
        var row = $(el);
        var tds = row.find('td');
        var flight = tds.eq(6).find('a').eq('1').attr('href');

        if (flight !== undefined) {
            flights.push(flight);
        }
    });

    return flights;
};

Scraper.prototype.parseFlightPage = function(html) {
    if (html === undefined) {
        return undefined;
    }

    var self = this;
    var $ = cheerio.load(html);

    $('#coordinates').remove();

    var pilot = $('#hpTitle').html().replace(/\n|<span.*<\/span>/gi, "");
    var title = $('.vfFlightText').text();

    var club = '',
        glider = '',
        date = '',
        start = '',
        finish = '',
        duration = '',
        takeoff = '',
        landing = '',
        total = '',
        multiplier = '',
        score = '';

    var totalCollected = false;

    $('.viewRow').each(function(index, el) {
        var $el = $(el);
        var label = $el.find('.viewLabel').text();
        var text = $el.find('.viewText').text();

        switch (label) {
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
                if (!totalCollected) {
                    totalCollected = true;
                    total = text;
                }
                break;

            case 'Multiplier':
                multiplier = text;
                break;

            case 'Score':
                score = text;
                break;

            default:
                0;
        }
    });

    // get stats from panel
    var stats = $('#xcTab-stats-content');
    var maxHeight = stats.find('#xcTab-stats-height-max').text();
    var lowHeight = stats.find('#xcTab-stats-height-low').text();
    var takeoffHeight = stats.find('#xcTab-stats-height-ta').text();
    var maxClimb = stats.find('#xcTab-stats-climb-max').text();
    var minClimb = stats.find('#xcTab-stats-climb-min').text();
    var maxSpeed = stats.find('#xcTab-stats-speed-max').text();
    var avgSpeedCourse = stats.find('#xcTab-stats-speed-avgCourse').text();
    var avgSpeedTrack = stats.find('#xcTab-stats-speed-avgCourse').text();

    var model = {
        identifier: id,
        pilot: pilot,
        title: title,
        club: club,
        glider: glider,
        date: moment(date, 'DD MMM YYYY'),
        start: start,
        startNum: parseFloat(start || 0),
        finish: finish,
        finishNum: parseFloat(finish || 0),
        duration: duration,
        durationNum: parseFloat(duration || 0),
        takeoff: takeoff,
        landing: landing,
        total: parseFloat(total || 0),
        multiplier: multiplier,
        score: parseFloat(score || 0),
        maxHeight: parseFloat(maxHeight || 0),
        lowHeight: parseFloat(lowHeight || 0),
        takeoffHeight: parseFloat(takeoffHeight || 0),
        maxClimb: parseFloat(maxClimb || 0),
        minClimb: parseFloat(minClimb || 0),
        maxSpeed: parseFloat(maxSpeed || 0),
        avgSpeedCourse: parseFloat(avgSpeedCourse || 0),
        avgSpeedTrack: parseFloat(avgSpeedTrack || 0)
    }

    self.models.push(model);

    var nextUrl = $('.navNext a').attr('href');
    if (nextUrl !== 'undefined' && nextUrl !== undefined) {
        console.log("nextUrl: ", nextUrl);
        return nextUrl;
    } else {
        console.log("no more urls");
    }
}

module.exports = Scraper;
