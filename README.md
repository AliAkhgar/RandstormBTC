### Overview

This repo is only a PoC of the vulnerability, and it does not offer any definitive result as its only aimed to be for research information. Please note that this article is not for newcomers looking into this vulnerability, as some basis is not explained.

# What is Randstorm? 
> Randstorm() is a term we coined to describe a collection of bugs, design decisions, and API changes that, when brought in contact with each other, combine to dramatically reduce the quality of random numbers produced by web browsers of a certain era (2011-2015).  *UncipheredLabs LLC*

This vulnerability has been taken place in years between 2010 and 2015 in the result of using a not-so-much pseudo random number generator (PRNG) which was assumed safe to generate Bitcoin wallets on some browsers which `window.crypto` was not present, yet.

# What does it mean?
In the end, the generated wallet (Private-Key) was still a 256-bit private key which is perfectly fine, but there were some key issues in this particular procedure to make Bitcoin wallets.
 - This procedure can be repeated or simulated.
 - The source for filling a pool with 256 indices had 2^32 entropy.
 - Other attempts for adding entropy to source has/can be compromised, like RC4 or Unix time seeding.

These issues led to wallet generation from a source with low entropy and a procedure with can be simulated with many side-channel attacks.

# A Deep Dive
Back in the days, the developers of Bitcoinlib-JS had a challenge for compatibility on browsers which did not have `window.crypto`. To overcome this issue, they came up with the idea of using PRNGs as the source of entropy to make a 256-bit pool of data; Requesting each 2-bits from `Math.random`. Splitting each random number to high-bytes and low-bytes and placing them in the pool and repeating to fill all 256 indices. But it was not all their idea, they just used the JSBN library which was...
>  a fast, portable implementation of large-number math in pure JavaScript, enabling public-key crypto and other applications on desktop and mobile browsers.

So after adding the library internally and using a bunch of its functions, developers of Bitcoinlib-JS were getting random pool of 256-bit values, that was assumed, Cryptography-Safe keys which could represent a bitcoin wallet.

### But it was not!
Back in the days, PRNGs were used as a good source of randomness until proved wrong, at least for many of them.
The JSBN library, was one of the victims of using a poor PRNG to provide a **sequentially-generate** 256-bit values representing cryptographic keys. Although the result indeed was a  cryptographic-key, But the key itself was coming from a source of low entropy! Meaning that guessing the cryptography key itself, would have been less difficult than decrypting the data encrypted with the key...?  *I dont know, you tell me!*


# How did it happen?
A class in JSBN called `SecureRandom` was responsible for generating random bytes, and it would provide a new batch of random bytes every time calling `nextBytes` function with sending the required length as argument, 256 in this context. 

By looking at the code below, we can see how this class was initialized on `PageLoad`.

    if(rng_pool == null) {
      rng_pool = new Array();
      rng_pptr = 0;
      var t; 
      while(rng_pptr < rng_psize) {
        t = Math.floor(65536 * Math.random());
        rng_pool[rng_pptr++] = t >>> 8;
        rng_pool[rng_pptr++] = t & 255;
      }
      rng_pptr = 0;
      rng_seed_time();
      //rng_seed_int(window.screenX);
      //rng_seed_int(window.screenY);
    }
In the beginning, This class is only initialized once per page, meaning that all subsequent calls for wallet generations is done trough this single instance of `SecureRandom` inside 
`Bitcoin.ECDSA` class from Bitcoinlib-JS.
Before going further, first sights of vulnerability shows itself by knowing some about `Math.Random`. Prior to 2015, `Math.Random` was using a deterministic algorithm called **MWC1616** to generate random numbers with 2 initial seeds.

This algorithm was supposed to offer 2^53 entropy, but after researches, it was uncovered that it was only offering up to 2^32 entropy and collisions would start at **30,000** random number generations. It was later revealed that not only this, but all other deterministic algorithms **output can be predicted Ahead-of-Time** if we can have a pair of their seed or some output values made at a specific time.

### Meaning That
If an attacker tries to guess the 256-bit pool used to generate wallets, each 2 indices of the pool are for sure one of the  ~4.5 Billion possible values MWC1616 offers, which is not considered secure, probably somewhere after 2010.
Not only that, if the attackers could come up with the initial seeds used to initialize `Math.Random`, they easily can generate a sequence of outputs which some portion of it might represent the 256-bit pool used to generate a Bitcoin wallet.


### And a second flaw
After generating a pool of 256-bits, the pool would have been seeded with time, seems like twice!

    function rng_seed_int(x) {
      rng_pool[rng_pptr++] ^= x & 255;
      rng_pool[rng_pptr++] ^= (x >> 8) & 255;
      rng_pool[rng_pptr++] ^= (x >> 16) & 255;
      rng_pool[rng_pptr++] ^= (x >> 24) & 255;
      if(rng_pptr >= rng_psize) rng_pptr -= rng_psize;
    }
    
    function rng_seed_time() {
      rng_seed_int(new Date().getTime());
    }

At first, the pool is seeded with time in class initialization. But shortly after, just before the generation of RC4 class for the first time, the pool was seeded again.
At the time of writing, I don't know whether seeding twice would introduce a higher entropy or not.
**But it is obvious that**, This effort to introduce entropy into the pool is not effective as the seed is Unix-Time in milliseconds and can be recovered easily and also attackers could limit this seed range by examining the transactions of a Bitcoin wallet.

### There is more
After a pool is ready and seeded, just on the time user wants to generate a wallet, this pool as sent to a **RC4** which is a stream cipher. On this point, pool is no longer in use and all generations of pseudo random bytes are done through RC4 by calling the function `nextBytes` on `SecureRandom` class.

    function rng_get_byte() {
      if(rng_state == null) {
        rng_seed_time();
        rng_state = prng_newstate();
        rng_state.init(rng_pool);
        for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
          rng_pool[rng_pptr] = 0;
        rng_pptr = 0;
        //rng_pool = null;
      }
      // TODO: allow reseeding after first request
      return rng_state.next();
    }
    function rng_get_bytes(ba) {
      var i;
      for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
    }
    SecureRandom.prototype.nextBytes = rng_get_bytes;

As can be seen on lines 9 and 11, there were plans for reseeding or regeneration of the pool, but that was not happening in that times.
**The problem is that**, the pool was not regenerated until user refresh the page and also there are multiple vulnerabilities found in RC4 which drives it deprecated nowadays. Causing the third step in this process to be vulnerable to attacks too, and we also do not explore this section.

# A Quick Glance
If we plan to traditionally visualize this process of `SecureRandom` initialization and wallet generations, it would be something like this.

![](https://storage.yaslab.org/rnds1.jpg)

But there are still many missing things about the visualization above and the vulnerability itself as reports on the internet shows, however many websites used Bitcoinlib-JS to generate wallets, many of them introduced their own source of entropy to the code.
Some websites used `window.x` and `window.y` as seed, which is still considered weak, but some other services have used **user interactions** to achieve greater and more secure randomness.

# Vulnerability Status
According to services online, there are still ~22.5 millions of non-zero bitcoin wallets woth of 1 Billion $ out there that may be vulnerable to these attacks.
There has been reports and researches that show successful exploitation of Randstorm by *UncipheredLabs LLC*.  


# How severe it is?
*The discussion below is mainly based on what discussed above.*

Keeping in mind that Randstorm indeed is a vulnerability, after many careful code examination, it does not some to be a so vulnerable as it looks. Lets take a look at steps and efforts are required to successfully exploit Randstorm.

###MWC1616 Prediction
One of the key players in Randstorm is MWC1616 prediction which has been successfully done through Z3 and also UncipheredLabs announced that they had successfully predicted the MWC1616 in order to uncover a wallet Private-Key.
Without using the original MWC1616 or not predicting the values, attackers would likely end up in a dead end already; But is that really that easy to do so?

By looking into **the V8 Engine** used in **Chromium** prior to version 49, we can see that MWC1616 initial seeds are generated by another LFSR algorithm, which makes the initial seeds hard to determine. Besides, we should take into consideration that each browser tabs had their own isolated context.

Even if attackers predict the random outputs, they would probably achieve many hypothetical correctly-guessed sequence of random numbers. In these situations, generated data is far beyond a 256-bit pool and is only a very large correct sequence.
So what they would end up is likely to be like a pre-recorded film, just need to extract a correct 256-bit array of it!

![](https://storage.yaslab.org/rnds2.jpg)

### Pool Seed
Even though MCW1616 prediction might be the hardest thing to do, correctly seeding the pool with exact Unix time is another thing. The way it works in most cases is to limit the time of wallet creation to month, weeks or even days!
While this might seem an easy work, we should know that even 1 single day is 86,400,000 milliseconds; Leaving the attacker 86 Million possible seeds for only one day.


### RC4 Cipher Stream
Although RC4 has some known vulnerability which makes some aspects of attacks too easier, there is probably a good side of it preventing Randstorm to be much worse vulnerability; And that is being *Stream Cipher*.
> This means that same inputs to the same RC4, will not have the same output.

This creates a new situation which the past generations of the wallet by RC4, affects the current wallet (Private-Bytes) generation that can lead attackers not to get the correct Private-Bytes, despite having the correct Pool.


## Conclusion
With all said, Randstorm seems to be an important and also hard to crack vulnerability. But do not get me wrong, experienced or funded hackers might be able to successfully exploit Randstorm especially when there are specific targets selected. And there seems to be just little enough decisions colliding so that mass attack on these legacy wallets might not work at all.

**Unless,** we are missing something...!

## Demonstration
There is a PoC of this article which is a migrated version of BitcoinJS-lib to modern V8-NodeJS with keeping all legacy libraries intact to have better simulation.
Please note that this PoC contains other codes like Redis which was for a purpose of successful exploit validating and many other changes that are beyond the scope of this article just to provide a correct PoC.
Please keep in mind that running the PoC for millions of times will not guess a Bitcoin wallet.


## Credit & Sources

https://medium.com/betable/tifu-by-using-math-random-f1c308c4fd9d
https://www.unciphered.com/blog/randstorm-you-cant-patch-a-house-of-cards
https://github.com/bitcoinjs/bitcoinjs-lib
https://github.com/v8/v8/commit/085fed0fb5c3b0136827b5d7c190b4bd1c23a23e#diff-c6dca714f70f69e1093dcd58f655ebe82d3a246e9375c0582808fc57fbb47ac8L250
https://v8.dev/blog/math-random
https://github.com/v8/v8/blob/623cbdc5432713badc9fe1d605c585aabb25876c/src/js/math.js




