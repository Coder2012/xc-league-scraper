import puppeteer from "puppeteer";
import fs from "fs";
import flightUrls2019 from "./flights-2019.mjs";

(async (fls) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", log => console[log._type](log._text));

  await page.goto("http://xcleague.com/xc/leagues/2019-1.html?vx=2");
  let data = {
    flights: [],
    pages: []
  };

  data = await page.evaluate(
    (data, fls) => {
      const exists = (link, urls) => urls.some(url => url == link);
      const trs = document.querySelectorAll("#leagueTable tbody tr");

      for (const tr of trs) {
        let link = tr.querySelector("td:nth-child(9) a").href;
        let viewPage = link.match(/leagues/);

        if (viewPage && viewPage[0] !== null) {
          data.pages.push(link);
        } else if (!exists(link, fls)) {
          data.flights.push(link);
        }
      }

      return data;
    },
    data,
    fls
  );

  // console.log(data);

  for (const url of data.pages) {
    await page.goto(url);

    data = await page.evaluate(
      (data, fls) => {
        const exists = (link, urls) => urls.some(url => url == link);
        const links = document.querySelectorAll(
          "#leagueTable [class^=flight] a:first-child"
        );

        for (const link of links) {
          if (!exists(link, fls)) data.flights.push(link.href);
        }
        return data;
      },
      data,
      fls
    );
  }

  console.log('flights', data.flights)

  const file = fs.createWriteStream('flights-latest.mjs')
  file.on('error', function(err) { console.log('error writing log') })
  file.write('const flights = [')
  data.flights.forEach(function(flight) { file.write(`"${flight}",\n`) })
  file.write('];\n')
  file.write('export default flights')
  file.end();

  browser.close();
})(flightUrls2019);
