"use strict";


//router.get('/get/server/state', function (req, res) {



var fs = require('fs') ,
    path = require('path') ,
    request = require('request') ;



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),

    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/get/server/state?key=' + serverConfig.adminKey ;




request.get({url: url}, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});








