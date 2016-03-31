"use strict" ;


var ConfigsService = require('../services/ConfigsService') ,

    serverConfig = ConfigsService.getServerConfig() ;


    
function isAuthorized (key, callback) {
    return callback(null, true) ;
}


function isAdminAuthorized (key, callback) {
    return callback(null, (serverConfig.adminKey === key));
}

module.exports = {
    isAuthorized      : isAuthorized ,
    isAdminAuthorized : isAdminAuthorized ,
};

