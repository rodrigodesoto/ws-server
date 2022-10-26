//arquivo de configuração do servidor de WebSockets
const WebSocket = require('ws');
require('dotenv').config();

function onError(ws, err) {
    console.error(`onError: ${err.message}`);
}

function onMessage(ws, data) {
    console.log(`onMessage: ${data}`);
    ws.send(`recebido!`);
}

function onConnection(ws, req) {
    ws.on('message', data => onMessage(ws, data));
    ws.on('error', error => onError(ws, error));
    console.log(`onConnection`);
}

function broadcast(jsonObject) {
    if (!this.clients) return;
    this.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(jsonObject));
        }
    });
}

function corsValidation(origin) {
    if(origin){
        if(process?.env?.CORS_ORIGIN){
            return process.env.CORS_ORIGIN === '*' || process.env.CORS_ORIGIN.startsWith(origin);
        }else{
            return true;
        }
    }else{
        return true;
    }
}

function verifyClient(info, callback) {
    console.log("info: "+info.origin)

    if (!corsValidation(info.origin)) return callback(false);

    const token = info.req.url.split('token=')[1];

    if (token) {
        if (token === '123456')
            return callback(true);
    }

    return callback(false);
}

module.exports = (server) => {
    const wss = new WebSocket.Server({
        server,
        verifyClient
    });

    wss.on('connection', onConnection);
    wss.broadcast = broadcast;

    console.log(`App Web Socket Server is running!`);
    return wss;
}
