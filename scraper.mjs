import http from 'http';
import cheerio from 'cheerio';
import moment from 'moment';
    // util = require('util'),
import EventEmitter from 'events';

const STATUS_CODES = http.STATUS_CODES,
    domain = 'http://www.xcleague.com',
    regex = /\d+/g;

let id = '';

class Scraper {
    
    constructor(url) {
        this.eventEmitter = new EventEmitter();
        this.index = 0;
        this.url = url;
        this.urls = [];
        this.init();
    }
    
    init() {
        this.models = [];
    
        this.eventEmitter.on('loadedPilotPage', (html) => {
            this.urls = this.parseLeaguePage(html);
            this.url = domain + this.urls[this.index];
            this.loadPage('loadedFlightPage');
        });
    
        this.eventEmitter.on('loadedFlightPage', (html) => {
            var nextUrl = this.parseFlightPage(html);
            if (nextUrl !== undefined && nextUrl !== 'undefined') {
                console.log("loadedFlightPage: ", nextUrl);
                this.url = domain + nextUrl;
                this.loadPage('loadedFlightPage');
            } else {
                if (this.index < this.urls.length - 1) {
                    this.index++;
                    this.url = domain + this.urls[this.index];
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
            date: moment.utc(date, 'DD MMM YYYY'),
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
    
        this.models.push(model);
    
        var nextUrl = $('.navNext a').attr('href');
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
