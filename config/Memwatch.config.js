'use strict';

var fs    = require('fs'),
    path  = require('path'),
    merge = require('merge'),

    hotConfigPath = path.join(__dirname, './Memwatch.hot.config.json') ,

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    staticConfig = {
        logFilePath : path.join(__dirname, '../logs/', 'memwatch.log') ,
    };


module.exports = merge(staticConfig, hotConfig);
