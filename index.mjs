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
import { createClient } from 'redis';
import readline from 'readline'
import fs from 'fs'
import process from 'process'


/**
 * Load Redis
 */
var client = null
try {
    client = createClient({
        url: 'redis://default:1234@192.168.0.144:6379'
    })
    
    await client.connect();
    console.log('[START] Connected to Redis');
} catch (e) {
    console.error(e)
}

//Load the file into redis
const LOAD  = true
if (LOAD==true){
    try{
        
        await client.flushDb()
        const readInterface = readline.createInterface({
            input: fs.createReadStream('btah.txt'),
            console: false
        });
        var i = 1;
        var wallets = []
        readInterface.on('line', function(line) {
            console.log(i);
            if(!line.startsWith("1") || i>22685755){
                readInterface.close()
                return;
            }
            console.clear()
            wallets.push(line)
            i++;
        });

        //start by loading into redis
        readInterface.on('close',async()=>{
            for (var i=0;i<wallets.length;i++){
                await client.set(wallets[i],"1")
                console.clear()
                console.log("Loading > ",i)
            }
            console.log("Load Finished.")
            process.exit(0)
        })
    }catch(e){
        console.log(e)
    }


   // process.exit(0)

}



var i =0;
while (!LOAD &&  i<1){
    var btc = new Bitcoin.ECKey();
    console.log("Private Key > ",btc.getExportedPrivateKey())
    console.log("Private Key Hex> ",btc.toString())

    console.log("BTC Addr> ",btc.getBitcoinAddress().toString())
    console.log("Pub Addr> ",Base58.encode(btc.getPub()))
    
    i++;
}




