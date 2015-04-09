var Model = require('./model');
var Scraper = require('./scraper');
var Pages = [];
var domain = 'http://www.xcleague.com';
var savedModels = [];

function generateUrls(limit) {
  var url = domain + '/xc/leagues/all-1.html';
  var urls= [url];

  return urls;
}

// store all urls in a global variable  
Pages = generateUrls();

function scrapePilots() {
  // if the Pages array is empty, we are Done!!
  if (!Pages.length) {
    return console.log('Done!!!!');
  }
  var url = Pages.pop();
  var scraper = new Scraper(url);
  var model;
  console.log('Requests Left: ' + Pages.length);
  // if the error occurs we still want to create our
  // next request
  scraper.on('error', function (error) {
    console.log(error);
    scrapePilots();
  });
  // if the request completed successfully
  // we want to store the results in our database
  scraper.on('complete', function (models) {
    for (var i = 0; i < models.length; i++) {
      model = new Model(models[i]);
      savedModels.push(model);
      model.save(function(err) {
        if (err) {
          console.log('Database err saving: ' + url);
        }
      });
    };

  });
}

scrapePilots();