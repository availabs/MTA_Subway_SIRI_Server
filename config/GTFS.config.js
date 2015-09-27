'use strict';

var fs    = require('fs'),
    path  = require('path'),
    merge = require('merge'),

    // FIXME: Find a better way.
    tripKeyBuilder = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.tripKeyBuilder,

    dataDirPath    = path.normalize(path.join(__dirname, '../data/GTFS/')),

    hotConfigPath = path.join(__dirname, './GTFS.hot.config.json') ,

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    staticConfig = {
        gtfsConfigFilePath          : __filename                    ,

        tripKeyBuilder              : tripKeyBuilder                ,

        dataDirPath                 : dataDirPath                   ,
        tmpDirPath                  : path.join(dataDirPath, 'tmp') ,

        indexedScheduleDataFileName : 'indexedScheduleData.json'    ,
        indexedSpatialDataFileName  : 'indexedSpatialData.json'     ,
        indexingStatisticsFileName  : 'indexingStatistics.json'     ,
    };


module.exports = merge(staticConfig, hotConfig);
