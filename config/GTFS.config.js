'use strict';

var fs    = require('fs'),
    path  = require('path'),
    merge = require('merge'),

    // To change MTA NYCT GTFS trip_ids to GTFS-Realtime trip_ids, we need to 
    // TODO: Move this to hot.config so changable through console.
    
    tripKeyMutator = [/.{9}/, ''], 

    dataDirPath = path.normalize(path.join(__dirname, '../data/GTFS/')),
    tmpDirPath  = path.join(dataDirPath, 'tmp') ,
    logsDir     = path.normalize(path.join(__dirname, '../logs/')) ,
    

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

        indexedScheduleDataFilePath : path.join(dataDirPath, '/indexedScheduleData.json') ,
        indexedSpatialDataFilePath  : path.join(dataDirPath, '/indexedSpatialData.json') ,
        indexingStatisticsLogPath   : path.join(logsDir, '/spatialDataIndexingStats.txt') ,
    };


module.exports = merge(staticConfig, hotConfig);
