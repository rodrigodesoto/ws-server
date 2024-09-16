module.exports = {stock};

async function stock(){
    const stock = {
        stockCode: String,
        shortName: String,
        longName: String,
        currentPrice: Number,
        qtd: Number,
        vlBuy: Number,
        vlTotal: Number,
        open: Number,
        high: Number,
        low: Number,
        marketChange: Number,
        dtBuy: Date,
        dtUpdate: Date,
        order: Number,
        advfnCode: String
    };
}

try{
    await stockModel.stock();
    return stock;
} catch(err){
    return err
}





