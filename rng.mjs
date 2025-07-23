import './prng4.mjs';


var  hi = 0;
var lo = 0;
// Copied from v8.cc and adapted to make the function deterministic.
function DeterministicRandom() {
  if (hi == 0) hi = 0xbfe166e7;
  if (lo == 0) lo = 0x64d1c3c9;

  // Mix the bits.
  hi = 36969 * (hi & 0xFFFF) + (hi >> 16);
  lo = 18273 * (lo & 0xFFFF) + (lo >> 16);
  return (hi << 16) + (lo & 0xFFFF);
}


// var state0 = 1;
// var state1 = 2;
// function mwc1616() {
//   state0 = 18030 * (state0 & 0xFFFF) + (state0 >> 16);
//   state1 = 30903 * (state1 & 0xFFFF) + (state1 >> 16);
//   return state0 << 16 + (state1 & 0xFFFF);
// } 

var MAX_RAND = Math.pow(2, 32);

// Global MWC1616 implementation for deterministic behavior
class MWC1616 {
    constructor(seed1 = 1, seed2 = 2) {
        this.state = [seed1 & 0xFFFFFFFF, seed2 & 0xFFFFFFFF];
    }

    // Set seeds based on timestamp for deterministic behavior
    seedFromTimestamp(timestamp) {
        // Use timestamp to derive two seeds deterministically
        const seed1 = (timestamp & 0xFFFFFFFF) ^ 0x12345678;
        const seed2 = ((timestamp >>> 16) & 0xFFFFFFFF) ^ 0x87654321;
        this.state = [seed1, seed2];
    }

    nextRandom() {
        var r0 = (18030 * (this.state[0] & 0xFFFF)) + (this.state[0] >>> 16) | 0;
        var r1 = (36969 * (this.state[1] & 0xFFFF)) + (this.state[1] >>> 16) | 0;
        this.state = [r0, r1];

        var x = ((r0 << 16) + (r1 & 0xFFFF)) | 0;
        if (x < 0) {
            x = x + MAX_RAND;
        }
        return x / MAX_RAND;
    }
}


  var state0 = 1;
  var state1 = 2;
 function mwc1617() {
      state0 = 18030 * (state0 & 0xffff) + (state0 >> 16);
      state1 = 30903 * (state1 & 0xffff) + (state1 >> 16);
      return state0 << 16 + (state1 & 0xffff);
  };

 
class SecureRandom {
  constructor(seed) {
    this.seed = seed
    this.mwc = new MWC1616();
    this.mwc.seedFromTimestamp(seed);
    
    // Initialize the pool with deterministic randomness
    if (this.rng_pool == null) {
      this.rng_pool = new Array();
      this.rng_pptr = 0;
      var t;
      while (this.rng_pptr < rng_psize) { 
        // Use deterministic MWC1616 instead of Math.random()
        t = Math.floor(65536 * this.mwc.nextRandom());
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
     // console.log(">>> arc-four")
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
      // Use the seed directly for deterministic behavior
      this.rng_seed_int(this.seed);
      console.log(">>> Time seeded.")
    }

}

globalThis.SecureRandom=SecureRandom

// SecureRandom.prototype.nextBytes = rng_get_bytes;
// SecureRandom.prototype.rng_state = null
// SecureRandom.prototype.rng_pool = null
// SecureRandom.prototype.rng_pptr = null

// SecureRandom.prototype.rng_seed_int = rng_seed_int
// SecureRandom.prototype.rng_seed_time = rng_seed_time