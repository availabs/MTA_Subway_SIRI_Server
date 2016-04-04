"use strict";


//router.post('/update/GTFS-Realtime/config', function(req, res) {


var fs = require('fs') ,
    path = require('path') ,
    request = require('request') ,
    _ = require('lodash');



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),
    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    feedConfigFilePath = path.join(configDirPath, serverConfig.activeFeed + '.json'),
    feedConfig = JSON.parse(fs.readFileSync(feedConfigFilePath)),

    gtfsrtConfig = feedConfig.gtfsrt ,

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/update/GTFS-Realtime/config' ;



request.post({ url: url, form: _.merge({key: serverConfig.adminKey}, gtfsrtConfig)}, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});




