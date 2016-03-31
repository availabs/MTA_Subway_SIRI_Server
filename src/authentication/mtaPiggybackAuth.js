"use strict" ;


var request = require('request') ,

    ConfigsService = require('../services/ConfigsService') ,

    serverConfig = ConfigsService.getServerConfig() ,

    mtaBusURL = "https://bustime.mta.info/api/siri/stop-monitoring.json";


var validKeys = {} ;


    
function isAuthorized (key, callback) {
    var url = mtaBusURL + '?key=' + key + '&MonitoringRef=DOES_NOT_EXIST';

    if (validKeys[key] !== undefined) {
console.log('pre-authed');
        return callback(null, validKeys[key]) ;
    } else {
        return request(url, function (err, res) {
            if (err) {
console.log('auth error:', err.stack);
                return callback(err);
            } else if (res.statusCode === 200) {
console.log('auth success');
                return callback(null, (validKeys[key] = true));
            } else if (res.statusCode === 403) {
console.log('auth failure');
                return callback(null, (validKeys[key] = false));
            } else {
console.log('auth error status code:', res.statusCode);
                return callback(new Error('MTA Piggyback Authorization received an error ' +
                                          'status code of ' + res.statusCode));
            }
        });
    }
}


function isAdminAuthorized (key, callback) {
    return callback(null, (serverConfig.adminKey === key));
}

module.exports = {
    isAuthorized      : isAuthorized ,
    isAdminAuthorized : isAdminAuthorized ,
};

