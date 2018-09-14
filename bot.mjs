import Model from './model';
import Scraper from './scraper.mjs';

const domain = 'http://www.xcleague.com';

let pages = [];

const generateUrls = () => {
    // test url for errors
    //http://www.xcleague.com/xc/flights/20142100.html?vx=0111
    let url = domain + '/xc/leagues/all-1.html';
    let urls = [url];
    return urls;
}

const scrapePilots = () => {
    if (!pages.length) {
        console.log("All pages now scraped");
        return;
    }

    let url = pages.pop();
    let scraper = new Scraper(url);
    let model;

    console.log('Requests Left: ' + pages.length);

    scraper.events.on('error', function(error) {
        console.log('bot error received from Scraper: ', error);
        scraper.resume();
    });

    scraper.events.on('complete', function(models) {
        for (var i = 0; i < models.length; i++) {
            model = new Model(models[i]);
            // console.log(model)
            model.save(function(err) {
                if (err) {
                    console.log('Database error saving: ' + url);
                }
            });
        };
        console.log("All models successfully saved to MongoDB");
    });
}

pages = generateUrls();
scrapePilots();
