var Model = require('./model');
var Scraper = require('./scraper');
var pages = [];
var domain = 'http://www.xcleague.com';
var flightUrls = [];

function generateUrls(limit) {
    // test url for errors
    //http://www.xcleague.com/xc/flights/20142100.html?vx=0111
    var url = domain + '/xc/leagues/all-1.html';
    var urls = [url];

    return urls;
}

pages = generateUrls();

function scrapePilots() {

    if (!pages.length) {
        console.log("All pages now scraped");
        return;
    }

    var url = pages.pop();
    var scraper = new Scraper(url);
    var model;

    console.log('Requests Left: ' + pages.length);

    scraper.on('error', function(error) {
        console.log('bot error received from Scraper: ', error);
        scraper.resume();
    });

    scraper.on('complete', function(models) {

        for (var i = 0; i < models.length; i++) {
            model = new Model(models[i]);
            model.save(function(err) {
                if (err) {
                    console.log('Database error saving: ' + url);
                }
            });
        };
        console.log("All models saved to MongoDB");

    });
}

scrapePilots();
