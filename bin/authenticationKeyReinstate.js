"use strict";


//router.post('/authentication/key/reinstate', function(req, res) {


var fs = require('fs') ,
    path = require('path') ,
    process = require('process') ,
    request = require('request') ;


if (process.argv.length < 3) {
    console.error('USAGE: This script takes a single argument, the key to reinstate.');
    process.exit(1);
}



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),

    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/authentication/key/reinstate',

    reinstatedKey = process.argv[2];



request.post({ url: url, form: {key: serverConfig.adminKey, reinstatedKey: reinstatedKey} }, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});

