const horizon = require('./horizon');

module.exports.processTx = async function(builder,wallet){
    let tx = await builder.setTimeout(180).build()
    
    await tx.sign(wallet)
    let txResult = await horizon.submitTransaction(tx)
    return txResult.hash;
}