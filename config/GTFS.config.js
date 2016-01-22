'use strict';

var fs    = require('fs'),
    path  = require('path'),
    merge = require('merge'),

    // To change MTA NYCT GTFS trip_ids to GTFS-Realtime trip_ids, we need to 
    tripKeyMutator = [/.{9}/, ''],

    dataDirPath = path.normalize(path.join(__dirname, '../data/GTFS/')),
    tmpDirPath  = path.join(dataDirPath, 'tmp') ,

    feedDataZipFileName = 'gtfs.zip',
    feedDataZipFilePath = path.join(tmpDirPath, 'gtfs.zip'),

    hotConfigPath = path.join(__dirname, './GTFS.hot.config.json') ,

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    staticConfig = {
        gtfsConfigFilePath          : __filename                 ,

        tripKeyMutator              : tripKeyMutator             ,

        dataDirPath                 : dataDirPath                ,
        tmpDirPath                  : tmpDirPath                 ,

        feedDataZipFileName         : feedDataZipFileName        ,
        feedDataZipFilePath         : feedDataZipFilePath        ,

        indexedScheduleDataFileName : 'indexedScheduleData.json' ,
        indexedSpatialDataFileName  : 'indexedSpatialData.json'  ,
        indexingStatisticsFileName  : 'indexingStatistics.txt'   ,
    };


module.exports = merge(staticConfig, hotConfig);
