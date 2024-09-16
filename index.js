const app = require('./src/app/app');
const appWs = require('./src/app/app-ws');
const pageScraper = require('./src/scraper/pageScraper');
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
           const  tickets = await pageScraper.scraper();

            if(tickets.name != 'ProtocolError' && tickets.name != 'TimeoutError'){

                    for (let i = 0; i < Object.keys(tickets).length; i++) {
                        broadcastData(i, tickets);
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

async function broadcastData(i, tickets) {
    wss.broadcast({ id: i, ticker: tickets[i].ticket, quote: tickets[i] });
    setTimeout(() => broadcastData(i, tickets), 3000);
}

setInterval(async () => {
    main();
}, 120000);
