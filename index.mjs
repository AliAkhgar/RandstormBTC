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
import cluster from 'cluster'
import { exec } from 'child_process'

/**
 * Load Redis
 */
var client = null
try {
    client = createClient({
        url: 'redis://default:1234@127.0.0.1:6379'
    })
    
    await client.connect();
    console.log('[START] Connected to Redis');
} catch (e) {
    console.error(e)
}

//Load the file into redis
const LOAD  = false
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
            if(!line.startsWith("1") || i>22685755){ //22685755
                readInterface.close()
                return;
            }
            console.log(i);
            console.clear()
            wallets.push(line)
            i++;
        });

        //start by loading into redis
        readInterface.on('close',async()=>{
            var x = wallets.length-1;
            while (x--){
                await client.set(wallets[x],"1")
                delete wallets[x]
                console.clear()
                console.log("Loading > ",x)
            }
            console.log("Load Finished.")
            process.exit(0)
        })
    }catch(e){
        console.log(e)
    }


   // process.exit(0)

}


if (cluster.isPrimary) {
	cluster.fork();
	cluster.fork();
	cluster.fork();
	cluster.fork();
    //cluster.fork();
	//cluster.fork();
}else{
    var i =0;
    console.time('test'+process?.pid);
    while (!LOAD &&  i<30000000){
    
        //console.clear()
        var btc = new Bitcoin.ECKey(1305044095468 + Math.floor(i/(10000)));
        //console.log("Private Key > ",btc.getExportedPrivateKey())
        //console.log("Private Key Hex> ",btc.toString())
     
        console.log("Worker Pid >",process?.pid," Testing > ",btc.getBitcoinAddress().toString()," | ",i)
        //console.log("Pub Addr> ",Base58.encode(btc.getPub()))
        //1NTp6iv9iH15XZoJg4D73SxoPwWsf9XkQc
        const res = await client.get(btc.getBitcoinAddress().toString())//Base58.encode(btc.getPub()) 
        //btc.getBitcoinAddress().toString()
        if (res!=null){
            var cont = `PV: ${btc.getExportedPrivateKey()}  \n
             PVHEX: ${btc.toString()} \n
             Pub: ${Base58.encode(btc.getPub())}  \n
             Addr: ${btc.getBitcoinAddress().toString()}  \n
        `
            console.log(">>> Found, Exit,",cont)
            fs.writeFile("./"+btc.getExportedPrivateKey()[0]+process?.pid+".txt",
            cont, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            }); 
            break;
        }    
        i++;
    }
    console.timeEnd('test'+process?.pid);
    console.log(process?.pid)
}


//process.exit(0)


