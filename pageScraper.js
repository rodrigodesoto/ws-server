const puppeteer = require('puppeteer');

const scraperObject = {
    async scraper(tickets) {
        let usuario = 'rodrigochoucinodesoto'
        let senha = 'advfn77*'
        const urlLogin = 'https://br.advfn.com/common/account/login'

        try{ 
            let arrTickets = [];
            
            // Inicia o navegador
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox','--disable-setuid-sandbox']
              })

            // Abre uma nova página
            const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
            void new Promise(resolve => setTimeout(resolve, 10000))
            const page = await browser.newPage();

            // Navega para a URL especificada
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36')
            await page.goto(urlLogin, {waitUntil: "load", timeout: 0})
            await sleep(2000)
            await page.waitForSelector('#afnmainbodid > div > div.content-row.login-page.row.w-100.m-0 > div.content-column-left.col-xl-6.col-lg-12.left.white-background.d-flex.flex-row-reverse > div > form > div:nth-child(2) > input');
            await page.type('#afnmainbodid > div > div.content-row.login-page.row.w-100.m-0 > div.content-column-left.col-xl-6.col-lg-12.left.white-background.d-flex.flex-row-reverse > div > form > div:nth-child(2) > input', usuario, {delay: 185});
            await page.keyboard.press('Tab');
            await page.waitForSelector('#password-input');
            await page.type('#password-input', senha, {delay: 185});
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.click(`#afnmainbodid > div > div.content-row.login-page.row.w-100.m-0 > div.content-column-left.col-xl-6.col-lg-12.left.white-background.d-flex.flex-row-reverse > div > form > input.submit-button.btn.btn-primary`)
            await page.waitForNavigation()
            
            for (let i = 0; i < Object.keys(tickets).length; i++) {
                let tickerConversion = Object.values(tickets)[i].toString();
                // Navega para a URL especificada
                await page.goto('https://br.advfn.com/bolsa-de-valores/bovespa/'+tickerConversion+'/cotacao', { waitUntil: 'domcontentloaded' });
    
                // Aguarda que o elemento esteja disponível na página
                await page.waitForSelector('#quote-header > div > div.price-container');
    
                // Captura o valor do elemento
                const name = await page.$eval('#quote-header > div > div.flex-container.mt-2.mb-3 > div.ml-2 > h1 > span.ticker', element => element.textContent.trim());
                const valuePrice = await page.$eval('#quote-header > div > div.price-container > div.price-info > span', element => element.textContent.trim());
                const valuePercent = await page.$eval('#quote-header > div > div.price-container > div.price-info > div > span:nth-child(3)', element => element.textContent.trim().replace('(', '').replace(')', ''));
                const valueOpen = await page.$eval('#quoteElementPiece12', element => element.textContent.trim());
                // const dailyValueRange = await page.$eval('[data-test="dailyRange"]', element => element.textContent.trim());
                // const traço = dailyValueRange.indexOf('-');
                const valueMin = await page.$eval('#quoteElementPiece13', element => element.textContent.trim());
                const valueMax = await page.$eval('#quoteElementPiece14', element => element.textContent.trim());
                const stateTrading = await page.$eval('#quote-header > div > div.price-container > div.delayed-indicator > div > a > div', element => element.textContent.trim());
                const timeTrading = await page.$eval('#quote-header > div > div.price-container > div.delayed-indicator > div > div > span', element => element.textContent.trim());
    
                let quote  = {};
                quote['ticket'] = Object.keys(tickets)[i].toString();
                quote['name'] = name;
                quote['price'] = valuePrice;
                quote['marketChange'] = valuePercent;
                quote['open'] = valueOpen;
                quote['low'] = valueMin;
                quote['high'] = valueMax;
                quote['stateTrading'] = stateTrading.replace('Dados em ','');
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
