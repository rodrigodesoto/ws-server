//responsável por subir nosso servidor
const app = require('./app');
const appWs = require('./app-ws');
// var cotacoesBovespa = require('cotacoes-bovespa');
var tickerEnum = require('./ticker-enum');
var fetch = require('node-fetch');
var request = require("request");

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`App Express is running!`);
})

const wss = appWs(server);

setInterval(async () => {
    // let carteira = [];
    // for (let i = 0; i < Object.keys(tickerEnum).length; i++) {
    //     await fetch('https://brapi.dev/api/quote/' + Object.keys(tickerEnum)[i], {
    //         method: 'GET', // or 'PUT'
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: null,
    //     })
    //         .then((response) => response.json())
    //         .then((data) => {
    //             console.log('Success:', data);
    //             carteira.push({ticker: Object.keys(tickerEnum)[i].toString(), quote: data.results[0]})
    //         })
    //         .catch((error) => {
    //             console.error('Error:', error);
    //         });
    // }
    // if (carteira.length === Object.keys(tickerEnum).length) {
    //     wss.broadcast(carteira);
    // } else {
    //     carteira = [];
    // }

    // cotacoesBovespa.getCurrentQuote('PRIO3', function(err, quote){
    //     // quote.price = Math.random().toPrecision(2)
    //     wss.broadcast({ ticker: 'PRIO3' , quote: quote });
    //     console.log(quote);
    // });

    this.getCurrentQuote('PRIO3', function(err, quote){
            // quote.price = Math.random().toPrecision(2)
            wss.broadcast({ ticker: 'PRIO3' , quote: quote });
            console.log(quote);
        });

}, 5000);


module.exports.getCurrentQuote = function (ticker, callback) {
    request("https://finance.yahoo.com/quote/" + ticker + ".sa/", function (
        err,
        res,
        body
    ) {
        if (err) {
            callback(err);
        }

        const main = JSON.parse(
            body.split("root.App.main = ")[1].split(";\n}(this));")[0]
        );
        let quote = {};

        if (
            main.context.dispatcher.stores?.QuoteSummaryStore.financialData !==
            undefined
        ) {
            quote.price = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.financialData
                    .currentPrice.fmt
            );
            quote.open = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.price.regularMarketOpen
                    .fmt
            );
            quote.high = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.price
                    .regularMarketDayHigh.fmt
            );
            quote.low = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.price
                    .regularMarketDayLow.fmt
            );
            quote.previousClose = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.price
                    .regularMarketPreviousClose.fmt
            );
            quote.volume = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.price
                    .regularMarketVolume.fmt
            );
            quote.marketChange = parseFloat(
                main.context.dispatcher.stores.QuoteSummaryStore.price
                    .regularMarketChange.fmt
            );
            quote.shortName =
                main.context.dispatcher.stores.QuoteSummaryStore.price.shortName;
            quote.longName =
                main.context.dispatcher.stores.QuoteSummaryStore.price.longName;
        }

        callback(null, quote);
    });
};
