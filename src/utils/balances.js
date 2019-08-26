const { ASSET } = require('../utils/constants');

module.exports.getPorteBal = function(account) {
    let balPORTE = "0.0";
    let arrBalPORTE = account.balances.filter(bal => bal.asset_code == ASSET.CODE)
    if(arrBalPORTE.length > 0)
        balPORTE = arrBalPORTE[0].balance;
    return balPORTE;
}