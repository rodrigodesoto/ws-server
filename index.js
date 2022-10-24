const app = require('./app');
const appWs = require('./app-ws');
var tickerEnum = require('./ticker-enum');
var fetch = require("node-fetch");

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`App Express is running!`);
})

const wss = appWs(server);
setInterval(async () => {
    try {
        for (let i = 0; i < Object.keys(tickerEnum).length; i++) {
            await getCurrentQuote(Object.keys(tickerEnum)[i].toString(), await function(err, quote){
                if(quote){
                    wss.broadcast({ id: i, ticker: Object.keys(tickerEnum)[i].toString() , quote: quote });
                    console.log({id: i, ticker: Object.keys(tickerEnum)[i].toString(), quote: quote});
                }
            });
        }
    } catch (error) {
        return error;
    }
}, 30000);

async function getCurrentQuote(ticker, callback) {
    const response = await fetch("https://finance.yahoo.com/quote/" + ticker + ".sa/")
    const body = await response.text();
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
            // quote.price = quote.price + Math.random()
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
};
