'use strict';

var fs    = require('fs'),
    path  = require('path'),
    merge = require('merge'),

    hotConfigPath = path.join(__dirname, './GTFS-Realtime.hot.config.json'),

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    staticConfig = {
        protofilePath     : path.join(__dirname, '../proto_files/nyct-subway.proto') ,
        feedReaderLogPath : path.join(__dirname, '../logs/gtfsrtFeedReader.log')     ,
    };

hotConfig.feedURL = hotConfig.baseURL + '?key=' + hotConfig.apiKey;

module.exports = merge(staticConfig, hotConfig);
