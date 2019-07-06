import Model from "./model";
import Scraper from "./scraper.mjs";

const domain = "http://www.xcleague.com";

let pages = [];

const generateUrls = () => {
  // test url for errors
  //http://www.xcleague.com/xc/flights/20142100.html?vx=0111
  let url = domain + "/xc/leagues/2015-1.html";
  let urls = [url];
  return urls;
};

const scrapePilots = () => {
  if (!pages.length) {
    console.log("All pages now scraped");
    return;
  }

  let url = pages.pop();
  let scraper = new Scraper(url);

  console.log("Requests Left: " + pages.length);

  scraper.events.on("error", function(error) {
    console.log("bot error received from Scraper: ", error);
    scraper.resume();
  });

  scraper.events.on("complete", function(models) {
    Model.schema.pre("save", function(next) {
      var self = this;
      Model.find({ identifier: self.identifier }, function(err, docs) {
        if (docs === null || docs.length === 0) {
          console.log("Saving", self.identifier);
          next();
        } else {
          console.log("user exists: ", self.identifier);
          next(new Error("User exists!"));
        }
      });
    });

    for (let m of models) {
      let model = new Model(m);
      console.log(`Pilot: ${model.pilot} - ${model.identifier}`);
      model.save(function(err) {
        if (err) {
          console.log("Database error saving: " + model.identifier);
        }else{
          console.log('Saved', model.identifier)
        }
      });
    }

    console.log("All models successfully saved to MongoDB");
  });
};

pages = generateUrls();
scrapePilots();
