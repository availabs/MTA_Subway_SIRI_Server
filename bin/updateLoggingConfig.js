"use strict";


//router.post('/update/Logging/config', function(req, res) {


var fs = require('fs') ,
    path = require('path') ,
    request = require('request') ,
    _ = require('lodash');



var configDirPath = path.join(__dirname, '../config/'),

    serverConfigFilePath = path.join(configDirPath, 'server.json'),
    serverConfig = JSON.parse(fs.readFileSync(serverConfigFilePath)),

    loggingConfigFilePath = path.join(configDirPath, 'logging.json'),
    loggingConfig = JSON.parse(fs.readFileSync(loggingConfigFilePath)),

    defaultPortNumber = serverConfig.defaultPortNumber || 16180 ,

    url = 'http://localhost:' + defaultPortNumber + '/admin/update/Logging/config' ;



request.post({ url: url, form: _.merge({key: serverConfig.adminKey}, loggingConfig), headers: { "content-type": "application/json" }, }, function (err, httpResponse, body) {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(body, null, 2));
    }
});




