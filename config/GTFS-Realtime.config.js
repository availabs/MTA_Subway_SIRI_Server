'use strict';

var fs    = require('fs') ,
    path  = require('path') ,
    merge = require('merge') ,

    hotConfigPath = path.join(__dirname, './GTFS-Realtime.hot.config.json') ,

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    protofileDirPath = path.join(__dirname, '../proto_files'),

    staticConfig = {
        protofileDirPath  : protofileDirPath ,
        protofilePath     : path.join(protofileDirPath, hotConfig.protofileName) ,
        feedReaderLogPath : path.join(__dirname, '../logs/gtfsrtFeedReader.log') ,

        // NOTE: The following two config parameters are developers,
        //       they are not accessible through the Admin Console
        //       as they would not make sense to use in a production env.
        logFeedReader : false,
        feedReaderLoggingLevel: "debug",
    };

module.exports = merge(staticConfig, hotConfig);
