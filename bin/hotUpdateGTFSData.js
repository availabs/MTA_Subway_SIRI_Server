"use strict";

/* ONLY SUPPORTS URL GTFS DATA UPDATES. */

//router.post('/update/GTFS/data', function(req, res) {


var fs = require('fs') ,
    path = require('path') ,
    request = require('request') ,
    _ = require('lodash');



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),
    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    feedConfigFilePath = path.join(configDirPath, serverConfig.activeFeed + '.json'),
    feedConfig = JSON.parse(fs.readFileSync(feedConfigFilePath)),

    gtfsConfig = feedConfig.gtfs ,

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/update/GTFS/data' ;



request.post({ url: url, form: _.merge({key: serverConfig.adminKey}, gtfsConfig)}, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});

