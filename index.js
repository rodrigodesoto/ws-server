const app = require('./app');
const appWs = require('./app-ws');
var tickerEnum = require('./ticker-enum');
const yahooFinance = require ('yahoo-finance2').default;

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
}, 10000);

async function getCurrentQuote(ticker, callback) {
    try {
        let quote = {}
        const queryOptions = { modules: ['price', 'summaryDetail'] }; // defaults
        const quoteTicker = await yahooFinance.quoteSummary(ticker+'.SA', queryOptions);
        console.log(quoteTicker);
        if (quoteTicker !== undefined) {
            quote.price = quoteTicker.price.regularMarketPrice;
            // quote.price = quote.price + Math.random()
            quote.open = quoteTicker.price.regularMarketOpen;
            quote.high = quoteTicker.price.regularMarketDayHigh;
            quote.low = quoteTicker.price.regularMarketDayLow;
            quote.previousClose = quoteTicker.price.regularMarketPreviousClose;
            quote.volume = quoteTicker.summaryDetail.averageVolume;
            quote.marketChange = quoteTicker.price.regularMarketChangePercent;
            quote.shortName = quoteTicker.price.shortName;
            quote.longName = quoteTicker.price.longName;
        }

        callback(null, quote);
    } catch (error) {
        return error;
    }
};
