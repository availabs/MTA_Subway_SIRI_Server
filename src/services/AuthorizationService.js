"use strict";


var ConfigsService = require('./ConfigsService') ,

    serverConfig = ConfigsService.getServerConfig() ,

    authenticatorModulePath = '../authentication/' + (serverConfig.authenticator || 'openAccess');


if (!serverConfig.authenticator) {
    console.log('\n\n-------------------------------\n' + 
                'No authenticator specified in /config/server.json. User API key validation is turned off.') ;
}

module.exports = require(authenticatorModulePath) ;
