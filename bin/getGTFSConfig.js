"use strict";


//router.get('/get/GTFS/config', function (req, res) {



var fs = require('fs') ,
    path = require('path') ,
    request = require('request') ;



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),

    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/get/GTFS/config?key=' + serverConfig.adminKey ;




request.get({url: url}, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});

