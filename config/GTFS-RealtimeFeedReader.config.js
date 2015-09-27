'use strict';

var fs    = require('fs'),
    path  = require('path'),
    merge = require('merge'),

    hotConfigPath = path.join(__dirname, './GTFS-RealtimeFeedReader.hot.config.json'),

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    staticConfig = {
        protofilePath : path.join(__dirname, '../proto_files/nyct-subway.proto') ,
    };

hotConfig.feedURL = hotConfig.baseURL + '?key=' + hotConfig.apiKey;

module.exports = merge(staticConfig, hotConfig);
