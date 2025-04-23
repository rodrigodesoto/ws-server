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

    try {
        const response = await axios.post(url, data);
        jwtToken = response.data.jwtToken;
    } catch (error) {
        console.error('Erro ao autenticar:', error.response ? error.response.data : error.message);
    }

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
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] });
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        );

        try {
            let arrTickets = [];

            for (let i = 0; i < tickets.length; i++) {
                const ticket = tickets[i];

                // Navegar até a página alvo
                await page.goto(`https://finance.yahoo.com/quote/${ticket.yahooCode}/`, {
                    waitUntil: 'domcontentloaded',
                });

                // Aguarda um dos elementos principais da página para garantir que está carregada
                try {
                    await page.waitForSelector('h1', { timeout: 5000 });
                } catch {
                    console.warn(`Página de ${ticket.yahooCode} pode não ter carregado completamente.`);
                    continue; 
                }

                // Capturar os valores desejados
                const data = await page.evaluate((ticket) => {
                    const getText = (selector) => {
                        const element = document.querySelector(selector);
                        return element ? element.innerText.trim() : null;
                    };

                    const name = getText('#nimbus-app > section > section > section > article > section.container.yf-4vs57a > div.top.yf-4vs57a > div > div.left.yf-4vs57a.wrap > section > h1'); // Seleciona o nome do ativo

                    const priceSelector = '#nimbus-app > section > section > section > article > section.container.yf-4vs57a > div.bottom.yf-4vs57a > div.price.yf-4vs57a > section > div > section > div.container.yf-16vvaki > div:nth-child(1) > span';
                    const valuePrice = getText(priceSelector)?.replace('.', ',') || null;

                    const percentSelector = '#nimbus-app > section > section > section > article > section.container.yf-4vs57a > div.bottom.yf-4vs57a > div.price.yf-4vs57a > section > div > section > div.container.yf-16vvaki > div:nth-child(3) > span';
                    const valuePercent = getText(percentSelector)?.replace('(', '').replaceAll('%)', '').replaceAll('+', '').replaceAll('.', ',') || null;

                    const openSelector = 'li:nth-child(2) > span.value > fin-streamer';
                    const valueOpen = getText(openSelector)?.replace('.', ',') || null;

                    const daysRangeSelector = 'li:nth-child(5) > span.value > fin-streamer';
                    const daysRange = getText(daysRangeSelector)?.replaceAll('.', ',') || null;

                    const [valueMin, valueMax] = daysRange ? daysRange.split(' - ') : [null, null];

                    const marketNoticeSelector = '#nimbus-app > section > section > section > article > section.container.yf-4vs57a > div.bottom.yf-4vs57a > div.price.yf-4vs57a > section > div > section > div.yf-12ejch4 > span > span';
                    const marketNotice = getText(marketNoticeSelector)
                    const regexState = /Open/;
                    const descricaoFechamento = regexState.test(marketNotice) ? "Open" : "Close";

                    const regexHora = /(\d{1,2}):(\d{2})/;
                    const match = marketNotice?.match(regexHora);
                    const horaFechamento = match ? match[0] : null;

                    return {
                        name,
                        valuePrice,
                        valuePercent,
                        valueOpen,
                        valueMin,
                        valueMax,
                        descricaoFechamento,
                        horaFechamento
                    };
                }, ticket);

                let quote = {
                    order: ticket.order,
                    ticket: ticket.stockCode,
                    name: data.name ? data.name.split(' (')[0] : null,
                    price: data.valuePrice ? data.valuePrice.substring(0, data.valuePrice.indexOf(',') + 3) : null,
                    marketChange: data.valuePercent || null,
                    open: data.valueOpen || null,
                    low: data.valueMin || null,
                    high: data.valueMax || null,
                    stateTrading: data.descricaoFechamento || "Desconhecido",
                    timeTrading: data.horaFechamento || null
                };

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
