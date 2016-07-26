"use strict" ;



var ConfigsService = require('../services/ConfigsService') ,

    serverConfig = ConfigsService.getServerConfig() ,

    bannedKeys = {} ;



function openAuth (key, callback) { callback(null, !bannedKeys[key]); }


function isAdminAuthorized (key, callback) {
    return callback(null, ((!serverConfig.adminKey) || (serverConfig.adminKey.toLowerCase() === key.toLowerCase())));
}

function banKey (key) { bannedKeys[key] = true; }

function reinstateKey (key) { delete bannedKeys[key]; }


module.exports = {
    isAuthorized      : openAuth ,
    isAdminAuthorized : isAdminAuthorized ,

    banKey       : banKey ,
    reinstateKey : reinstateKey ,
} ;
