const app = require('./app');
const appWs = require('./app-ws');
const tickerEnum = require('./ticker-enum');
const pageScraper = require('./pageScraper');
let executando = false;

const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`App Express is running!`);
})

const wss = appWs(server);


async function main() {

    if(!executando){
        executando = true;
        try {   
           const startTime = Date.now();
           let endTime;
           const  tickets = await pageScraper.scraper(tickerEnum);

            if(tickets.name != 'ProtocolError' && tickets.name != 'TimeoutError'){

                    for (let i = 0; i < Object.keys(tickets).length; i++) {
                        setInterval(async () => {
                            wss.broadcast({ id: i, ticker: tickets[i].ticket , quote: tickets[i] });
                            // console.log({id: i, ticker: Object.keys(tickerEnum)[i].toString(), quote: quote});
                        }, 3000);
                    }
                endTime = Date.now();
                const timeTaken = endTime - startTime;
                executando = false;
                console.log(tickets);
                console.log(`Tempo total de execução: ${timeTaken/1000} s`);
            } else {
                endTime = Date.now();
                const timeTaken = endTime - startTime;
                console.log(`Tempo total de execução: ${timeTaken/1000} s`);
                throw new Error(tickets);
            }
            
        } catch (error) {
            executando = false;
            console.log(error.stack);
            return error;
        }
    }
};

setInterval(async () => {
    main();
}, 5000);
