/**
 * Basic app config
 */

module.exports = function() {    
    const wavesConfig = { 
        minimumSeedLength: 25,
        requestOffset: 0,
        requestLimit: 100,
        logLevel: 'warning',
        timeDiff: 0,
        networkByte: 84,
        nodeAddress: 'http://127.0.0.1:6869',
        matcherAddress: 'http://127.0.0.1:6886' 
    };

    return { wavesConfig };
}
