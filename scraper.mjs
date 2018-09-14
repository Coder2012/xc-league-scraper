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
        // this.urls = [];
        this.urls = ["/xc/flights/20184128.html?vx=01200902", "/xc/flights/20184123.html?vx=01200902", "/xc/flights/20184127.html?vx=01200902", "/xc/flights/20184129.html?vx=01200902", "/xc/flights/20184122.html?vx=01200902", "/xc/flights/20184131.html?vx=01200902", "/xc/flights/20184132.html?vx=01200902", "/xc/flights/20184133.html?vx=01200902", "/xc/flights/20184125.html?vx=01200902", "/xc/flights/20184142.html?vx=01200902", "/xc/flights/20184139.html?vx=01200903", "/xc/flights/20184141.html?vx=01200903", "/xc/flights/20184140.html?vx=01200903", "/xc/flights/20184150.html?vx=01200903", "/xc/flights/20184188.html?vx=01200903", "/xc/flights/20184154.html?vx=01200903", "/xc/flights/20184147.html?vx=01200903", "/xc/flights/20184149.html?vx=01200904", "/xc/flights/20184148.html?vx=01200904", "/xc/flights/20184146.html?vx=01200904", "/xc/flights/20184180.html?vx=01200904", "/xc/flights/20184151.html?vx=01200904", "/xc/flights/20184145.html?vx=01200904", "/xc/flights/20184143.html?vx=01200904", "/xc/flights/20184144.html?vx=01200904", "/xc/flights/20184222.html?vx=01200905", "/xc/flights/20184173.html?vx=01200905", "/xc/flights/20184187.html?vx=01200905", "/xc/flights/20184213.html?vx=01200905", "/xc/flights/20184177.html?vx=01200905", "/xc/flights/20184166.html?vx=01200905", "/xc/flights/20184167.html?vx=01200905", "/xc/flights/20184158.html?vx=01200905", "/xc/flights/20184168.html?vx=01200905", "/xc/flights/20184160.html?vx=01200905", "/xc/flights/20184165.html?vx=01200905", "/xc/flights/20184163.html?vx=01200905", "/xc/flights/20184164.html?vx=01200905", "/xc/flights/20184171.html?vx=01200905", "/xc/flights/20184161.html?vx=01200905", "/xc/flights/20184236.html?vx=01200905", "/xc/flights/20184214.html?vx=01200905", "/xc/flights/20184162.html?vx=01200905", "/xc/flights/20184159.html?vx=01200905", "/xc/flights/20184191.html?vx=01200905", "/xc/flights/20184194.html?vx=01200906", "/xc/flights/20184208.html?vx=01200907", "/xc/flights/20184233.html?vx=01200907", "/xc/flights/20184205.html?vx=01200907", "/xc/flights/20184204.html?vx=01200907", "/xc/flights/20184201.html?vx=01200907", "/xc/flights/20184200.html?vx=01200907", "/xc/flights/20184215.html?vx=01200907", "/xc/flights/20184207.html?vx=01200907", "/xc/flights/20184198.html?vx=01200907", "/xc/flights/20184199.html?vx=01200907", "/xc/flights/20184217.html?vx=01200908", "/xc/flights/20184251.html?vx=01200913", "/xc/flights/20184242.html?vx=01200913", "/xc/flights/20184245.html?vx=01200913", "/xc/flights/20184239.html?vx=01200913", "/xc/flights/20184249.html?vx=01200913", "/xc/flights/20184255.html?vx=01200913", "/xc/flights/20184258.html?vx=01200913", "/xc/flights/20184235.html?vx=01200913", "/xc/flights/20184244.html?vx=01200913", "/xc/flights/20184234.html?vx=01200913", "/xc/flights/20184241.html?vx=01200913", "/xc/flights/20184238.html?vx=01200913", "/xc/flights/20184246.html?vx=01200913", "/xc/flights/20184259.html?vx=01200913", "/xc/flights/20184257.html?vx=01200913", "/xc/flights/20184240.html?vx=01200913", "/xc/flights/20184252.html?vx=01200913", "/xc/flights/20184248.html?vx=01200913", "/xc/flights/20184254.html?vx=01200913"]
        this.init();
    }
    
    init() {
        this.models = [];
    
        this.eventEmitter.on('loadedPilotPage', (html) => {
            // this.urls = this.parseLeaguePage(html);
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
            avgSpeedTrack: parseFloat(avgSpeedTrack || 0)
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
