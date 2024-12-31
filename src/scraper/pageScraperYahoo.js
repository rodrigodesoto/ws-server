const puppeteer = require('puppeteer');
const axios = require('axios');
const util = require('../util/util');

async function auth() {
    const url = process.env.url_b3_auth;
    const data = {
        email: process.env.user_b3,
        password: process.env.pw_b3
    };

    let jwtToken = null;

    await axios.post(url, data)
        .then(response => {
            jwtToken = response.data.jwtToken;
        })
        .catch(error => {
            console.error('Erro ao autenticar:', error.response ? error.response.data : error.message);
        });

    return jwtToken;
}

async function getAllStocks(jwtToken) {
    const url = 'https://b3-api-backend.herokuapp.com/stocks/getAllStocks';

    try {
        const response = await axios.get(url, {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        return response.data;

    } catch (error) {
        console.error('Erro ao obter as ações:', error.response ? error.response.data : error.message);
    }
}

const scraperObject = {
    async scraper() {
        const token = await auth();
        const tickets = await getAllStocks(token);
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        try {
            let arrTickets = [];

            for (let i = 0; i < tickets.length; i++) {
                const ticket = tickets[i];

                // Navegar até a página alvo
                await page.goto(`https://finance.yahoo.com/quote/${ticket.yahooCode}/`, {
                    waitUntil: 'domcontentloaded',
                });

                // Capturar os valores desejados
                const data = await page.evaluate((ticket) => {
                    const getText = (selector) => {
                        const element = document.querySelector(selector);
                        return element ? element.innerText.trim() : null;
                    };

                    const name = getText('#nimbus-app > section > section > section > article > section.container.yf-k4z9w > div.top.yf-k4z9w > div > div > section > h1');
                    const valuePrice = getText('#nimbus-app > section > section > section > article > section.container.yf-k4z9w > div.bottom.yf-k4z9w > div.price.yf-k4z9w > section > div > section > div.container.yf-1tejb6 > fin-streamer.livePrice.yf-1tejb6 > span');
                    const valuePercent = getText('#nimbus-app > section > section > section > article > section.container.yf-k4z9w > div.bottom.yf-k4z9w > div.price.yf-k4z9w > section > div > section > div.container.yf-1tejb6 > fin-streamer:nth-child(3) > span').replace('(','').replace('%)','');
                    const valueOpen = getText('#nimbus-app > section > section > section > article > div.container.yf-dudngy > ul > li:nth-child(2) > span.value.yf-dudngy > fin-streamer');
                    const daysRange = getText('#nimbus-app > section > section > section > article > div.container.yf-dudngy > ul > li:nth-child(5) > span.value.yf-dudngy > fin-streamer');

                    const [valueMin, valueMax] = daysRange ? daysRange.split(' - ') : [null, null];

                    const marketNotice = getText('#nimbus-app > section > section > section > article > section.container.yf-k4z9w > div.bottom.yf-k4z9w > div.price.yf-k4z9w > section > div > section > div:nth-child(2) > span > span');
                    const regexState = /Open/;
                    const descricaoFechamento = regexState.test(marketNotice) ? "Open" : "Close";
                    const regexHora = /(\d{1,2}):(\d{2})/;
                    const match = marketNotice.match(regexHora);
                    const horaFechamento = match ? match[0] : null;
                    const dataFechamento = marketNotice ? marketNotice: null;

                    return {
                        name,
                        valuePrice,
                        valuePercent,
                        valueOpen,
                        valueMin,
                        valueMax,
                        descricaoFechamento,
                        dataFechamento,
                        horaFechamento,
                    };
                }, ticket);

                let quote = {
                    order: ticket.order,
                    ticket: ticket.stockCode,
                    name: data.name ? data.name.split(' (')[0] : null,
                    price: data.valuePrice || null,
                    marketChange: data.valuePercent || null,
                    open: data.valueOpen || null,
                    low: data.valueMin || null,
                    high: data.valueMax || null,
                    stateTrading: data.descricaoFechamento || "Desconhecido",
                    timeTrading: data.dataFechamento ? data.horaFechamento : null,
                };
                // console.log(data.dataFechamento);
                // console.log(data.horaFechamento);
                arrTickets.push(quote);
            }

            await browser.close();
            return arrTickets;
        } catch (error) {
            console.error(error);
            return error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
};

module.exports = scraperObject;
