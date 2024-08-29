import './prng4.mjs';
// Random number generator - requires a PRNG backend, e.g. prng4.js

// For best results, put code like
// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
// in your main HTML document.



// var rng_state;
// var rng_pool;
// var rng_pptr;


//moved

// function rng_get_byte() {
//   if(true) {
//     rng_seed_time(this);
//     this.rng_state = prng_newstate();
//     console.log(rng_pool)
//     this.rng_state.init(rng_pool);
//     console.log("arc-four")
//     for(this.rng_pptr = 0; this.rng_pptr < this.rng_pool.length; ++this.rng_pptr)
//       this.rng_pool[this.rng_pptr] = 0;
//     this.rng_pptr = 0;
//     //rng_pool = null;

//   }
//   console.log(">>> next byte")
//   return this.rng_state.next();
// }



class SecureRandom {
  constructor() {
    //move 
    // Initialize the pool with junk if needed.
    if (this.rng_pool == null) {
      this.rng_pool = new Array();
      this.rng_pptr = 0;
      var t;
      while (this.rng_pptr < rng_psize) { // extract some randomness from Math.random()
        t = Math.floor(65536 * Math.random());
        this.rng_pool[this.rng_pptr++] = t >>> 8;
        this.rng_pool[this.rng_pptr++] = t & 255;
      }
      this.rng_pptr = 0;
      console.log(">>> Pool Initialized/ constructor");
      this.rng_seed_time();
    }

  }

  rng_get_bytes(ba) {
    var i;
    for(i = 0; i < ba.length; ++i) ba[i] = this.rng_get_byte();
  }
  

  nextBytes(ba){
    return this.rng_get_bytes(ba)
  }

  rng_get_byte() {
    if(this.rng_state == null) {
      this.rng_seed_time(this);
      this.rng_state = prng_newstate();
      this.rng_state.init(this.rng_pool);
      console.log(">>> arc-four")
      for(this.rng_pptr = 0; this.rng_pptr < this.rng_pool.length; ++this.rng_pptr)
        this.rng_pool[this.rng_pptr] = 0;
      this.rng_pptr = 0;
      //rng_pool = null;
  
    }
    return this.rng_state.next();
  }


  // Mix in a 32-bit integer into the pool
     rng_seed_int(x) {
      this.rng_pool[this.rng_pptr++] ^= x & 255;
      this.rng_pool[this.rng_pptr++] ^= (x >> 8) & 255;
      this.rng_pool[this.rng_pptr++] ^= (x >> 16) & 255;
      this.rng_pool[this.rng_pptr++] ^= (x >> 24) & 255;
      if(this.rng_pptr >= rng_psize) this.rng_pptr -= rng_psize;
    }

    // Mix in the current time (w/milliseconds) into the pool
     rng_seed_time(ctx) {
    // console.log(new Date().getTime())
      this.rng_seed_int(1294668800000);
      console.log(">>> Time seeded.",this.rng_pool)
    }

}


// SecureRandom.prototype.nextBytes = rng_get_bytes;
// SecureRandom.prototype.rng_state = null
// SecureRandom.prototype.rng_pool = null
// SecureRandom.prototype.rng_pptr = null

// SecureRandom.prototype.rng_seed_int = rng_seed_int
// SecureRandom.prototype.rng_seed_time = rng_seed_time

globalThis.SecureRandom=SecureRandom