"use strict";

var fs   = require('fs') ,
    crypto = require('crypto') ,

    ConfigsService = require('./ConfigsService') ,

    serverConfig = ConfigsService.getServerConfig(),

    apiKeysPath = serverConfig.apiKeysPath ,

    apiKeys;


try {
    apiKeys = fs.readFileSync(apiKeysPath);
} catch (e) {
    console.error('Could not read the authorized keys file. Starting with a blank slate.');
    apiKeys = {};
}
    



function isAuthorized (key) {
    return !!apiKeys[key];
}

function isAdminAuthorized (key) {
    return (serverConfig.adminKey === key);
}

function generateNewAPIKey (email, callback) {

    return crypto.randomBytes(28, function (err, buf) {
        if (err) { callback(err); }

        var newKey = buf.toString('hex');

        if (apiKeys[newKey]) {
            return generateNewAPIKey(email, callback);
        } else {
            apiKeys[newKey] = email;
            return fs.writeFile(apiKeysPath, JSON.stringify(apiKeys), function (err) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, newKey);
                }
            });
        }
    }) ;
}

module.exports = {
    isAuthorized      : isAuthorized ,
    isAdminAuthorized : isAdminAuthorized ,
    generateNewAPIKey : generateNewAPIKey ,
};
