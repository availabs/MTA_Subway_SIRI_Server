'use strict';

var fs    = require('fs'),
    path    = require('path') ,
    merge = require('merge'), 

    gtfsConfig   = require('./GTFS.config'),
    gtfsrtConfig = require('./GTFS-Realtime.config.js'),

    logsDir = path.normalize(path.join(__dirname, '../logs/')) ,

    hotConfigPath = path.join(__dirname, './Converter.hot.config.json'),
    hotConfig     = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    //TODO: After admin console supports these, move them to the hot config.
    fieldMutators = {
        OriginRef         : [/./, "MTA_$&"],
        DestinationRef    : [/./, "MTA_$&"],
        StopPointRef      : [/./, "MTA_$&"],
    } ,

    trainTrackerInitialStateFilePath = '../analysis/trainTrackerInitialState.json' ,
    trainTrackerInitialState ;

    try {
        trainTrackerInitialState = JSON.parse(fs.readFileSync(trainTrackerInitialStateFilePath)) ;
        console.log(
            'Starting the server with the trainTrackerInitialState found at ' + trainTrackerInitialStateFilePath
        );
    } catch (e) { 
        trainTrackerInitialState = null;
    }

    var staticConfig = {
        gtfsConfig                 : gtfsConfig                                   ,

        gtfsrtConfig               : gtfsrtConfig                                 ,

        logsDir                    : logsDir                                      ,

        fieldMutators              : fieldMutators                                ,

        converterLogPath           : path.join(logsDir, 'converter.log')          ,

        trainLocationsLogPath      : path.join(logsDir, 'trainLocations.log')     ,

        trainTrackingStatsLogPath  : path.join(logsDir, 'trainTrackingStats.csv') ,

        unscheduledTripsLogPath    : path.join(logsDir, 'unscheduledTrips.log')   ,

        noSpatialDataTripsLogPath  : path.join(logsDir, 'noSpatialDataTrips.log') ,

        trainTrackingErrorsLogPath : path.join(logsDir, 'trainTrackingErrors.log'),

        trainTrackerInitialState   : trainTrackerInitialState ,

        unscheduledTripIndicator   : '\u262f' ,
    };

    

module.exports = merge(staticConfig, hotConfig);
