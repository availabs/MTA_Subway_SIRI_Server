'use strict';

var fs    = require('fs'),
    path    = require('path') ,
    merge = require('merge'), 

    gtfsConfig   = require('./GTFS.config'),
    gtfsrtConfig = require('./GTFS-Realtime.config.js'),

    logsDir = path.normalize(path.join(__dirname, '../logs/')) ,

    hotConfigPath = path.join(__dirname, './Converter.hot.config.json'),
    hotConfig     = JSON.parse(fs.readFileSync(hotConfigPath)) ,


    staticConfig = {
        gtfsConfig                 : gtfsConfig                                   ,

        gtfsrtConfig               : gtfsrtConfig                                 ,

        logsDir                    : logsDir                                      ,

        trainLocationsLogPath      : path.join(logsDir, 'trainLocations.csv')     ,

        trainTrackingStatsLogPath  : path.join(logsDir, 'trainTrackingStats.csv') ,

        unscheduledTripsLogPath    : path.join(logsDir, 'unscheduledTrips.log')   ,

        noSpatialDataTripsLogPath  : path.join(logsDir, 'noSpatialDataTrips.log') ,

        trainTrackingErrorsLogPath : path.join(logsDir, 'trainTrackingErrors.log'),
    };

    

module.exports = merge(staticConfig, hotConfig);
