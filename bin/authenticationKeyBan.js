"use strict";


//router.post('/authentication/key/ban', function(req, res) {


var fs = require('fs') ,
    path = require('path') ,
    process = require('process') ,
    request = require('request') ;


if (process.argv.length < 3) {
    console.error('USAGE: This script takes a single argument, the key to ban.');
    process.exit(1);
}



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),

    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/authentication/key/ban',

    bannedKey = process.argv[2];



request.post({ url: url, form: {key: serverConfig.adminKey, bannedKey: bannedKey} }, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});
