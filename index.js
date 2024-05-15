const app = require('./app');
const appWs = require('./app-ws');
var tickerEnum = require('./ticker-enum');
const url = '/api/quote/';
const https = require('https');

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

        const options = {
          headers: {
            'Authorization': 'Bearer fS28BGD8uZPgqCS8vRfrwB'
          },
          method: 'GET',
          hostname: 'brapi.dev',
          path: url+ticker
        };
  
        const req = await https.request(options, (res) => {
          let data = '';
         
          res.on('data', (chunk) => {
            data += chunk;
          });
         
          res.on('end', () => {
            const jsonData = JSON.parse(data);
            const quoteTicker = jsonData.results[0];
            console.log(jsonData);
  
            let quote = {}
  
            console.log(quoteTicker);
            if (quoteTicker !== undefined) {
                quote.price = quoteTicker.regularMarketPrice;
                // quote.price = quote.price + Math.random()
                quote.open = quoteTicker.regularMarketOpen;
                quote.high = quoteTicker.regularMarketDayHigh;
                quote.low = quoteTicker.regularMarketDayLow;
                quote.previousClose = quoteTicker.regularMarketPreviousClose;
                quote.volume = quoteTicker.regularMarketVolume
                quote.marketChange = parseFloat(quoteTicker.regularMarketChangePercent).toPrecision(2);
                quote.shortName = quoteTicker.shortName;
                quote.longName = quoteTicker.longName;
            }
    
            callback(null, quote);
          }).on('error', (err) => {
            console.error('Erro ao fazer requisição:', err);
          });
        });
         
        req.end();
        
      } catch (error) {
          return error;
      }
};
