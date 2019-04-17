import http from 'http';
import cheerio from 'cheerio';
import moment from 'moment';
    // util = require('util'),
import EventEmitter from 'events';
import flightUrls2005 from './flights-2005.mjs';
import flightUrls2006 from './flights-2006.mjs';
import flightUrls2007 from './flights-2007.mjs';
import flightUrls2008 from './flights-2008.mjs';
import flightUrls2009 from './flights-2009.mjs';
import flightUrls2010 from './flights-2010.mjs';
import flightUrls2011 from './flights-2011.mjs';
import flightUrls2012 from './flights-2012.mjs';
import flightUrls2013 from './flights-2013.mjs';
import flightUrls2014 from './flights-2014.mjs';
import flightUrls2015 from './flights-2015.mjs';
import flightUrls2016 from './flights-2016.mjs';
import flightUrls2017 from './flights-2017.mjs';
import flightUrls2018 from './flights-2018.mjs';
import flightUrls2019 from './flights-2019.mjs';

const flightUrls = [
    ...flightUrls2005,
    ...flightUrls2006,
    ...flightUrls2007,
    ...flightUrls2008,
    ...flightUrls2009,
    ...flightUrls2010,
    ...flightUrls2011,
    ...flightUrls2012,
    ...flightUrls2013,
    ...flightUrls2014,
    ...flightUrls2015,
    ...flightUrls2016,
    ...flightUrls2017,
    ...flightUrls2018,
    ...flightUrls2019
]

const STATUS_CODES = http.STATUS_CODES,
    domain = 'http://www.xcleague.com',
    regex = /\d+/g;

let id = '';

class Scraper {
    
    constructor(url) {
        this.eventEmitter = new EventEmitter();
        this.index = 0;
        this.url = url;
        this.urls = flightUrls;
        this.init();
    }
    
    init() {
        this.models = [];
    
        this.eventEmitter.on('loadedPilotPage', (html) => {
            // this.urls = this.parseLeaguePage(html);
            this.url = this.urls[this.index];
            this.loadPage('loadedFlightPage');
        });
    
        this.eventEmitter.on('loadedFlightPage', (html) => {
            var nextUrl = this.parseFlightPage(html);
            if (nextUrl !== undefined && nextUrl !== 'undefined') {
                console.log("loadedFlightPage: ", nextUrl);
                this.url = nextUrl;
                this.loadPage('loadedFlightPage');
            } else {
                if (this.index < this.urls.length - 1) {
                    this.index++;
                    this.url = this.urls[this.index];
                    this.loadPage('loadedFlightPage');
                } else {
                    this.eventEmitter.emit('complete', this.models);
                }
            }
        });
    
        this.loadPage('loadedPilotPage');
    };
    
    resume() {
        this.eventEmitter.emit('loadedFlightPage');
    }
    
    loadPage(eventName) {
        id = this.url.match(regex)[0];
        console.log('\n\nLoading: ', this.url);
        console.log("id: ", id);
        
        http.get(this.url, (res) => {
            var body = '';
            if (res.statusCode !== 200) {
                return this.eventEmitter.emit('error', STATUS_CODES[res.statusCode]);
            }
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                this.eventEmitter.emit(eventName, body);
            });
        })
        .on('error', (err) => {
            this.eventEmitter.emit('error', err);
        });
    };
    
    parseLeaguePage(html) {
        var $ = cheerio.load(html);
        var table = $('#leagueTable');   
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
    
    parseFlightPage(html) {
        if (html === undefined) {
            return undefined;
        }
    
        var $ = cheerio.load(html);
    
        $('#coordinates').remove();
    
        // var pilot = $('#hpTitle').html().replace(/\n|<span.*<\/span>/gi, "");
        var pilot = $('.vfPilot').text();
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
            date: moment.utc(date, 'DD MMM YYYY').toDate(),
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
            avgSpeedTrack: parseFloat(avgSpeedTrack || 0),
            link: this.url
        }
    
        this.models.push(model);
    
        // var nextUrl = $('.navNext a').attr('href');
        var nextUrl = undefined;
        if (nextUrl !== 'undefined' && nextUrl !== undefined) {
            console.log("nextUrl: ", nextUrl);
            return nextUrl;
        } else {
            console.log("no more urls");
        }
    }

    get events() {
        return this.eventEmitter;
    }

}
export default Scraper;
