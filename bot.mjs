import Model from './model';
import Scraper from './scraper.mjs';

const domain = 'http://www.xcleague.com';

let pages = [];

const generateUrls = () => {
    // test url for errors
    //http://www.xcleague.com/xc/flights/20142100.html?vx=0111
    let url = domain + '/xc/leagues/2008-1.html';
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
        // for (var i = 0; i < models.length; i++) {
        //     setTimeout((m) => {
        //         var model = new Model(m);
        //         console.log(model)
        //         model.save(function(err) {
        //             if (err) {
        //                 console.log('Database error saving: ' + url);
        //             }
        //         });
        //     }, 50, models[i]);
        // }
        // var Potato = mongoose.model('Potato', PotatoSchema);

        // var potatoBag = [/* a humongous amount of potato objects */];

        Model.collection.insert(models, onInsert);

        function onInsert(err) {
            if (err) {
                // TODO: handle error
                console.log('Error inserting docs')
            } else {
                console.info('flights were successfully stored');
            }
        }
        console.log("All models successfully saved to MongoDB");
    });
}

pages = generateUrls();
scrapePilots();
