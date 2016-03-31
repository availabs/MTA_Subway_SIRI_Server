"use strict" ;



var ConfigsService = require('../services/ConfigsService') ,

    serverConfig   = ConfigsService.getServerConfig();



function openAuth (key, callback) { callback(null, true); }


function isAdminAuthorized (key, callback) {
    return callback(null, serverConfig.adminKey === key);
}


module.exports = {
    isAuthorized      : openAuth ,
    isAdminAuthorized : isAdminAuthorized ,
} ;
