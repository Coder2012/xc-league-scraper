const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('start')
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.on('console', (log) => console[log._type](log._text))
    console.log('end')
    await page.goto('http://xcleague.com/xc/leagues/2019-1.html?vx=2')
    let data = {
        flights: [],
        pages:[]
    }

    data = await page.evaluate((linksAarr) => {
        const trs = document.querySelectorAll('#leagueTable tbody tr')
        for (const tr of trs){
            let link = tr.querySelector('td:nth-child(9) a').href
            let viewPage = link.match(/leagues/)
            
            if(viewPage && viewPage[0] !== null) {
                linksAarr.pages.push(link)
            } else {
                linksAarr.flights.push(link)
            }       
        }
        return linksAarr
      }, data)
    
    //   console.log(data)

      for (const url of data.pages){
        await page.goto(url)
        // console.log(url)
        data = await page.evaluate((arr) => {
            const links = document.querySelectorAll('#leagueTable [class^=flight] a:first-child')

            for (const link of links){
                console.log(link.href)
                arr.flights.push(link.href)
            }
            return arr
        }, data)
    }

    // console.log(data.flights)

    const file = fs.createWriteStream('flights-2019.mjs')
    file.on('error', function(err) { console.log('error writing log') })
    file.write('const flights = [')
    data.flights.forEach(function(flight) { file.write(`"${flight}",\n`) })
    file.write('];\n')
    file.write('export default flights')
    file.end();

      browser.close()
  })()