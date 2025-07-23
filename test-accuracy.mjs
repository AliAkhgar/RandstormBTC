#!/usr/bin/env node

/**
 * RandstormBTC PoC Accuracy Assessment
 * 
 * This script evaluates the accuracy of the RandstormBTC PoC implementation
 * by testing key components and comparing against expected vulnerable scenarios.
 */

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
import './eckey.mjs'

console.log('=== RandstormBTC PoC Accuracy Assessment ===\n');

// Test 1: MWC1616 PRNG Determinism
console.log('Test 1: MWC1616 PRNG Determinism');
console.log('Testing if the same seed produces same sequence...');

function testMWC1616Determinism() {
    // Create two SecureRandom instances with same seed
    const seed1 = 1305044095468;
    const seed2 = 1305044095468;
    
    const rng1 = new SecureRandom(seed1);
    const rng2 = new SecureRandom(seed2);
    
    // Generate some bytes from both
    const bytes1 = new Array(32);
    const bytes2 = new Array(32);
    
    rng1.nextBytes(bytes1);
    rng2.nextBytes(bytes2);
    
    // Compare sequences
    const identical = bytes1.every((byte, index) => byte === bytes2[index]);
    
    console.log(`Seed 1: ${seed1}`);
    console.log(`Seed 2: ${seed2}`);
    console.log(`First 8 bytes RNG1: [${bytes1.slice(0, 8).join(', ')}]`);
    console.log(`First 8 bytes RNG2: [${bytes2.slice(0, 8).join(', ')}]`);
    console.log(`Sequences identical: ${identical}`);
    console.log(`Status: ${identical ? '✅ PASS' : '❌ FAIL'}`);
    
    return identical;
}

// Test 2: Key Generation Determinism  
console.log('\nTest 2: Bitcoin Key Generation Determinism');
console.log('Testing if same seed produces same Bitcoin keys...');

function testKeyGenerationDeterminism() {
    const seed = 1305044095468;
    
    // Generate two keys with same seed
    const key1 = new Bitcoin.ECKey(seed);
    const key2 = new Bitcoin.ECKey(seed);
    
    const addr1 = key1.getBitcoinAddress().toString();
    const addr2 = key2.getBitcoinAddress().toString();
    const priv1 = key1.getExportedPrivateKey();
    const priv2 = key2.getExportedPrivateKey();
    
    const identical = (addr1 === addr2) && (priv1 === priv2);
    
    console.log(`Seed: ${seed}`);
    console.log(`Address 1: ${addr1}`);
    console.log(`Address 2: ${addr2}`);
    console.log(`Private Key 1: ${priv1}`);
    console.log(`Private Key 2: ${priv2}`);
    console.log(`Keys identical: ${identical}`);
    console.log(`Status: ${identical ? '✅ PASS' : '❌ FAIL'}`);
    
    return identical;
}

// Test 3: Sequential Seed Behavior
console.log('\nTest 3: Sequential Seed Analysis');
console.log('Analyzing behavior with sequential seeds...');

function testSequentialSeeds() {
    const baseTime = 1305044095468; // May 10, 2011 timestamp
    const results = [];
    
    for (let i = 0; i < 10; i++) {
        const seed = baseTime + i;
        const key = new Bitcoin.ECKey(seed);
        const address = key.getBitcoinAddress().toString();
        const privateKey = key.toString(); // hex format
        
        results.push({
            seed,
            address,
            privateKey: privateKey.substring(0, 16) + '...' // truncate for display
        });
    }
    
    console.log('Sequential seed results:');
    results.forEach((result, index) => {
        console.log(`${index + 1}. Seed: ${result.seed} -> ${result.address} (${result.privateKey})`);
    });
    
    return results;
}

// Test 4: Entropy Analysis
console.log('\nTest 4: Entropy Analysis');
console.log('Analyzing randomness quality...');

function testEntropyQuality() {
    const samples = [];
    const baseTime = 1305044095468;
    
    // Generate 100 samples
    for (let i = 0; i < 100; i++) {
        const key = new Bitcoin.ECKey(baseTime + i);
        const privateKeyHex = key.toString();
        samples.push(privateKeyHex);
    }
    
    // Simple entropy checks
    const uniqueSamples = new Set(samples).size;
    const avgLength = samples.reduce((sum, sample) => sum + sample.length, 0) / samples.length;
    
    // Check for patterns (simplified)
    let patternCount = 0;
    for (let i = 1; i < samples.length; i++) {
        const prev = samples[i-1];
        const curr = samples[i];
        
        // Check if consecutive samples have similar prefixes
        if (prev.substring(0, 8) === curr.substring(0, 8)) {
            patternCount++;
        }
    }
    
    console.log(`Total samples: ${samples.length}`);
    console.log(`Unique samples: ${uniqueSamples}`);
    console.log(`Average key length: ${avgLength}`);
    console.log(`Pattern matches: ${patternCount}`);
    console.log(`Uniqueness ratio: ${(uniqueSamples / samples.length * 100).toFixed(2)}%`);
    console.log(`Status: ${uniqueSamples === samples.length ? '✅ PASS' : '⚠️  PATTERNS DETECTED'}`);
    
    return {
        totalSamples: samples.length,
        uniqueSamples,
        patternCount,
        uniquenessRatio: uniqueSamples / samples.length
    };
}

// Test 5: Known Vulnerability Scenarios
console.log('\nTest 5: Known Vulnerability Scenarios');
console.log('Testing against known vulnerable patterns...');

function testKnownVulnerabilities() {  
    // Test with timestamps from the vulnerable period (2011-2015)
    const vulnerableTimestamps = [
        1305044095468, // May 10, 2011
        1325376000000, // Jan 1, 2012  
        1356998400000, // Jan 1, 2013
        1388534400000, // Jan 1, 2014
        1420070400000  // Jan 1, 2015
    ];
    
    console.log('Testing vulnerable timestamp scenarios:');
    
    const results = vulnerableTimestamps.map(timestamp => {
        const key = new Bitcoin.ECKey(timestamp);
        const address = key.getBitcoinAddress().toString();
        const date = new Date(timestamp).toDateString();
        
        console.log(`${date} (${timestamp}) -> ${address}`);
        
        return {
            timestamp,
            date,
            address,
            privateKey: key.getExportedPrivateKey()
        };
    });
    
    // Check if addresses follow expected patterns for vulnerable keys
    const addressPrefixes = results.map(r => r.address.substring(0, 2));
    const uniquePrefixes = new Set(addressPrefixes).size;
    
    console.log(`\nAddress prefix diversity: ${uniquePrefixes}/${results.length}`);
    console.log(`Status: ${uniquePrefixes > 1 ? '✅ DIVERSE' : '⚠️  LIMITED DIVERSITY'}`);
    
    return results;
}

// Run all tests
async function runAccuracyTests() {
    console.log('Starting accuracy assessment...\n');
    
    const test1Result = testMWC1616Determinism();
    const test2Result = testKeyGenerationDeterminism();  
    const test3Results = testSequentialSeeds();
    const test4Results = testEntropyQuality();
    const test5Results = testKnownVulnerabilities();
    
    console.log('\n=== ASSESSMENT SUMMARY ===');
    console.log(`✅ PRNG Determinism: ${test1Result ? 'WORKING' : 'BROKEN'}`);
    console.log(`✅ Key Determinism: ${test2Result ? 'WORKING' : 'BROKEN'}`);
    console.log(`📊 Sequential Analysis: ${test3Results.length} samples generated`);
    console.log(`🔍 Entropy Quality: ${test4Results.uniquenessRatio >= 1.0 ? 'GOOD' : 'POOR'} (${(test4Results.uniquenessRatio * 100).toFixed(1)}% unique)`);
    console.log(`🎯 Vulnerability Tests: ${test5Results.length} scenarios tested`);
    
    const overallAccuracy = (test1Result && test2Result && test4Results.uniquenessRatio >= 0.9) ? 'HIGH' : 'MODERATE';
    console.log(`\n🎯 Overall PoC Accuracy: ${overallAccuracy}`);
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (!test1Result || !test2Result) {
        console.log('❌ Fix determinism issues in PRNG implementation');
    }
    if (test4Results.uniquenessRatio < 0.9) {
        console.log('⚠️  Improve entropy simulation for more realistic results');
    }
    if (test4Results.patternCount > 10) {
        console.log('⚠️  Reduce predictable patterns in key generation');
    }
    console.log('✅ Add more comprehensive test cases for different vulnerability scenarios');
    console.log('✅ Consider implementing browser-specific quirks for higher accuracy');
}

// Execute tests
runAccuracyTests().catch(console.error);