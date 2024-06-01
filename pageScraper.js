const puppeteer = require('puppeteer');

const scraperObject = {
    async scraper(tickets) {

        try{
            let arrTickets = [];
            
            // Inicia o navegador
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox','--disable-setuid-sandbox']
              })

            // Abre uma nova página
            const page = await browser.newPage();
    
            for (let i = 0; i < Object.keys(tickets).length; i++) {
                let tickerConversion = Object.values(tickets)[i].toString();
                // Navega para a URL especificada
                await page.goto('https://br.investing.com/equities/'+tickerConversion, { waitUntil: 'domcontentloaded' });
    
                // Aguarda que o elemento esteja disponível na página
                await page.waitForSelector('.text-5xl\\/9');
    
                // Captura o valor do elemento
                const name = await page.$eval('[data-test="chart-inner-title"]', element => element.textContent.trim());
                const valuePrice = await page.$eval('.text-5xl\\/9', element => element.textContent.trim());
                const valuePercent = await page.$eval('[data-test="instrument-price-change-percent"]', element => element.textContent.trim().replace('(', '').replace(')', ''));
                const valueOpen = await page.$eval('[data-test="open"]', element => element.textContent.trim());
                const dailyValueRange = await page.$eval('[data-test="dailyRange"]', element => element.textContent.trim());
                const valueMin = dailyValueRange.substring(0, 4);
                const valueMax = dailyValueRange.substring(dailyValueRange.length - 5, dailyValueRange.length);
                const stateTrading = await page.$eval('[data-test="trading-state-label"]', element => element.textContent.trim());
                const timeTrading = await page.$eval('[data-test="trading-time-label"]', element => element.textContent.trim());
    
                let quote  = {};
                quote['ticket'] = Object.keys(tickets)[i].toString();
                quote['name'] = name;
                quote['price'] = valuePrice;
                quote['marketChange'] = valuePercent;
                quote['open'] = valueOpen;
                quote['low'] = valueMin;
                quote['high'] = valueMax;
                quote['stateTrading'] = stateTrading;
                quote['timeTrading'] = timeTrading;
    
                arrTickets.push(quote);
            }
            // Fecha o navegador
            await browser.close();           
            return arrTickets;
        } catch (error) {
            executando = false;
            console.log(error);
            return error;
        }
    }
}

module.exports = scraperObject;
