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
            // console.log('JWT Token:', jwtToken);
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

        // Retornando a lista de objetos stock
        return response.data;

    } catch (error) {
        console.error('Erro ao obter as ações:', error.response ? error.response.data : error.message);
    }
}

const scraperObject = {
    async scraper() {
        const token = await auth();
        const tickets = await getAllStocks(token);
        // Iniciar o navegador e abrir uma nova página
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        try {
            let arrTickets = [];

            for (let i = 0; i < tickets.length; i++) {
                const ticket = tickets[i];
                // Navegar até a página alvo
                await page.goto('https://br.financas.yahoo.com/quote/' + ticket.yahooCode + '/', {
                    waitUntil: 'networkidle2',
                });

                // Capturar os valores desejados
                const data = await page.evaluate((ticket) => {
                    const selectorPrice = `fin-streamer[data-symbol="${ticket.yahooCode}"][data-field="regularMarketPrice"]`;
                    const selectorPercent = `fin-streamer[data-symbol="${ticket.yahooCode}"][data-field="regularMarketChangePercent"]`;
                    const name = document.querySelector('h1').innerText.substring(0, document.querySelector('h1').innerText.indexOf('(') - 2);
                    const valuePrice = document.querySelector(selectorPrice).innerText;
                    const valuePercent = document.querySelector(selectorPercent).innerText.trim().replace('(', '').replace(')', '').replace('%', '');

                    const valueOpen = document.querySelector('td[data-test="OPEN-value"]')
                        ? document.querySelector('td[data-test="OPEN-value"]').innerText
                        : null;

                    const valueMin = document.querySelector('td[data-test="DAYS_RANGE-value"]')
                        ? document.querySelector('td[data-test="DAYS_RANGE-value"]').innerText.substring(0, document.querySelector('td[data-test="DAYS_RANGE-value"]').innerText.indexOf(' '))
                        : null;

                    const valueMax = document.querySelector('td[data-test="DAYS_RANGE-value"]')
                        ? document.querySelector('td[data-test="DAYS_RANGE-value"]').innerText.substring(document.querySelector('td[data-test="DAYS_RANGE-value"]').innerText.lastIndexOf(' ') + 1, document.querySelector('td[data-test="DAYS_RANGE-value"]').innerText.lenght)
                        : null;

                    const descricaoFechamento = document.querySelector('div[id="quote-market-notice"]')
                        ? document.querySelector('div[id="quote-market-notice"]').innerText.substring(0, document.querySelector('div[id="quote-market-notice"]').innerText.indexOf(':'))
                        : null;

                    const dataFechamento = document.querySelector('div[id="quote-market-notice"]')
                        ? document.querySelector('div[id="quote-market-notice"]').innerText.substring(document.querySelector('div[id="quote-market-notice"]').innerText.indexOf(':') + 2, document.querySelector('div[id="quote-market-notice"]').innerText.lastIndexOf(':') - 3)
                        : null;

                    const horaFechamento = document.querySelector('div[id="quote-market-notice"]')
                        ? document.querySelector('div[id="quote-market-notice"]').innerText.substring(document.querySelector('div[id="quote-market-notice"]').innerText.lastIndexOf(':') - 2, document.querySelector('div[id="quote-market-notice"]').innerText.lastIndexOf(':') + 5)
                        : null;

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

                data.descricaoFechamento = data.descricaoFechamento.substring('A partir de ') ? "Em andamento" : data.descricaoFechamento;
                data.dataFechamento = data.dataFechamento.substring(':') ? util.formatarData(new Date()) : data.dataFechamento;
                data.horaFechamento = util.converterHora(data.horaFechamento);

                let quote  = {};
                quote['order'] = ticket.order;
                quote['ticket'] = ticket.stockCode;
                quote['name'] = data.name;
                quote['price'] = data.valuePrice;
                quote['marketChange'] = data.valuePercent;
                quote['open'] = data.valueOpen;
                quote['low'] = data.valueMin;
                quote['high'] = data.valueMax;
                quote['stateTrading'] = data.dataFechamento;
                quote['timeTrading'] = data.horaFechamento;
                // console.log(data);
                arrTickets.push(quote);
            }
            // Fecha o navegador
            await browser.close();
            return arrTickets;
        } catch (error) {
            executando = false;
            console.log(error);
            return error;
        } finally {
            if (browser) {
                await browser.close();
            }
            executando = false;
        }
    }
}

module.exports = scraperObject;
