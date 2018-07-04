/**
 * Encode given data as base64, and decode it back
 */

module.exports.encode = function(data) {    
    return Buffer.from(data).toString('base64');
}

module.exports.decode = function(data) {    
    return Buffer.from(data, 'base64').toString('ascii');
}
