"use strict" ;



var CACHE_CONFIG = {
    stdTTL : 3600, // Standard TTL is 1 hour.
    checkPeriod : 900, // Clean out the cache of dead keys every 15 min. 
};




var request = require('request') ,

    NodeCache = require('node-cache') ,

    authKeyCache = new NodeCache(CACHE_CONFIG) ,
    
    ConfigsService = require('../services/ConfigsService') ,

    serverConfig = ConfigsService.getServerConfig() ,

    mtaBusURL = "https://bustime.mta.info/api/siri/stop-monitoring.json" ,

    bannedKeys = {};



   
function isAuthorized (key, callback) {

    if (bannedKeys[key]) { callback(null, false); }

    var url = mtaBusURL + '?key=' + key + '&MonitoringRef=DOES_NOT_EXIST',

        isAuthd = authKeyCache.get(key) ;

    if (isAuthd !== undefined) {
        return callback(null, isAuthd) ;
    } else {

        return request(url, function (err, res) {
            if (err) {
                return callback(err);
            } else if (res.statusCode === 200) {
                // If auth succeeds, allow for 1 hour.
                authKeyCache.set(key, true, 3600); 
                return callback(null, true);
            } else if (res.statusCode === 403) {
                // If auth fails, ban for 10 min. (In case MTA server is throttling a valid key.)
                authKeyCache.set(key, false, 600);
                return callback(null, false);
            } else {
                return callback(new Error('MTA Piggyback Authorization received an error ' +
                                          'status code of ' + res.statusCode));
            }
        });
    }
}


function isAdminAuthorized (key, callback) {
    return callback(null, (serverConfig.adminKey.toLowerCase() === key.toLowerCase()));
}


function banKey (key) { 
    bannedKeys[key] = true; 
}

function reinstateKey (key) { 
    delete bannedKeys[key]; 
}

module.exports = {
    isAuthorized      : isAuthorized ,
    isAdminAuthorized : isAdminAuthorized ,

    banKey       : banKey ,
    reinstateKey : reinstateKey ,
};

