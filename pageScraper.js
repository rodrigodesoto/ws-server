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
            await page.goto(urlLogin, {waitUntil: "load", timeout: 60000 })
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
                const elementoBase = '#afnmainbodid > div:nth-child(10) > div.quote-header-container > div.quote-header-left > div > div > ';
                const elementoBaseContainer = elementoBase+'div.price-info-container';
                await page.waitForSelector(elementoBase+'div.price-info-container > div.price-info > div');
               
                // Captura o valor do elemento
                const name = await page.$eval(elementoBase+'div.ste-header > div > div.name-container > h3 > span.title-name', element => element.textContent.trim());
                const valuePrice = await page.$eval(elementoBaseContainer+' > div.price-info > div > div.price-block.heading-2xl > span', element => element.textContent.trim());
                const valuePercent = await page.$eval(elementoBaseContainer+' > div.price-info > div > div.change-block.main-values > div > span', element => element.textContent.trim().replace('(', '').replace(')', '').replace('%', ''));
                const campo = await page.$eval('#afnmainbodid > div.exchanges-page-container > div.two-col-row > div.col-one > div:nth-child(3) > div:nth-child(1) > div.delight-bordered-content > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)', element => element.textContent.trim());
                let valueOpen = '';

                if (campo.startsWith('Preço Anterior')) {
                    valueOpen = await page.$eval('#afnmainbodid > div.exchanges-page-container > div.two-col-row > div.col-one > div:nth-child(3) > div:nth-child(1) > div.delight-bordered-content > div > div:nth-child(2) > div:nth-child(3) > div.text-bold.text-default-primary', element => element.textContent.trim());
                } else {
                    valueOpen = await page.$eval('#afnmainbodid > div.exchanges-page-container > div.two-col-row > div.col-one > div:nth-child(3) > div > div.delight-bordered-content > div > div:nth-child(2) > div:nth-child(2) > div.text-bold.text-default-primary', element => element.textContent.trim());
                }

                const valueMin = await page.$eval('#afnmainbodid > div.exchanges-page-container > div.two-col-row > div.col-one > div:nth-child(3) > div:nth-child(1) > div.delight-bordered-content > div > div:nth-child(1) > div:nth-child(5) > div.range-labels.body-m.text-default-primary > span:nth-child(1)', element => element.textContent.trim());
                const valueMax = await page.$eval('#afnmainbodid > div.exchanges-page-container > div.two-col-row > div.col-one > div:nth-child(3) > div:nth-child(1) > div.delight-bordered-content > div > div:nth-child(1) > div:nth-child(5) > div.range-labels.body-m.text-default-primary > span:nth-child(3)', element => element.textContent.trim());
                const stateTrading = await page.$eval(elementoBaseContainer+' > div.price-info > div > div.description-block > div > a', element => element.textContent.trim().replace('Atrasado por ', '').replace('minutos', 'min'));
                const timeTrading = await page.$eval(elementoBaseContainer+' > div.price-info > div > div.description-block > span', element => element.textContent.trim().substring(0,5));
    
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
