import './crypto-js/crypto.mjs'
import './crypto-js/sha256.mjs'
import './crypto-js/ripemd160.mjs'


import './bitcoin.mjs'
import './address.mjs'

import './jsbn.mjs'
import './jsbn2.mjs'
import './base58.mjs'


import './util.mjs'
import './sec.mjs'
import './rng.mjs'
import  './eckey.mjs'
import Base58 from 'base-58'



var i =0;
while (i<1){
    var btc = new Bitcoin.ECKey();
    console.log("Private Key > ",btc.getExportedPrivateKey())
    console.log("BTC Addr> ",btc.getBitcoinAddress().toString())

    console.log("Private Key Hex> ",btc.toString())
    console.log("Pub Addr> ",Base58.encode(btc.getPub()))
    
    i++;
}

//console.log(new Bitcoin.ECKey().getExportedPrivateKey())



