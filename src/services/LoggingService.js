'use strict';


var winston = require('winston') ,
    DailyRotateFile = require('winston-daily-rotate-file') ;

var ConfigsService = require('./ConfigsService') ,

    //gtfsrtConfig    = ConfigsService.getGTFSRealtimeConfig(),

    loggingConfig = ConfigsService.getLoggingConfig() ;

    //memwatchConfig  = ConfigsService.getMemwatchConfig();



var binaryLoggingLevels = {
        off : 0 ,
        on  : 1 ,
    } ;





var dataAnomalyLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logDataAnomalies ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        //new (winston.transports.DailyRotateFile)({
        new (DailyRotateFile)({
            filename  : loggingConfig.dataAnomaliesLogPath,
            colorize  : false ,
            datePattern : '.yyyy-MM-dd' ,
            stringify : metaDataStringifier ,
            label     : 'DataAnomalyLogger',
        }) ,
    ],
});


var errorLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logErrors ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        new (DailyRotateFile)({
            filename  : loggingConfig.errorsLogPath,
            colorize  : false ,
            datePattern : '.yyyy-MM-dd' ,
            stringify : metaDataStringifier ,
            label     : 'ErrorLogger',
        }) ,
    ],
});



var trainLocationsLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logTrainLocations ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        new (DailyRotateFile)({
            filename    : loggingConfig.trainLocationsLogPath ,
            colorize    : false ,
            datePattern : '.yyyy-MM-dd' ,
            stringify   : metaDataStringifier ,
            label       : 'ConverterTrainLocationsLogger' ,
        }) ,
    ],
});



var trainTrackingStatsLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logTrainTrackingStats ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        new (DailyRotateFile)({
            filename  : loggingConfig.trainTrackingStatsLogPath,
            colorize  : false ,
            stringify : metaDataStringifier ,
            datePattern : '.yyyy-MM-dd' ,
            label     : 'TrainTrackingStatsLogger',
        }) ,
    ],
});



var unscheduledTripsLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logTrainTrackingStats ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        new (DailyRotateFile)({
            filename  : loggingConfig.unscheduledTripsLogPath,
            colorize  : false ,
            datePattern : '.yyyy-MM-dd' ,
            stringify : metaDataStringifier ,
            label     : 'TrainTrackingStatsLogger',
        }) ,
    ],
});



var noSpatialDataTripsLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logTrainTrackingStats ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        new (DailyRotateFile)({
            filename  : loggingConfig.noSpatialDataTripsLogPath,
            colorize  : false ,
            datePattern : '.yyyy-MM-dd' ,
            stringify : metaDataStringifier ,
            label     : 'TrainTrackingStatsLogger',
        }) ,
    ],
});


var trainTrackingErrorsLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : loggingConfig.logTrainTrackingErrors ? 'on' : 'off',
    exitOnError: false ,

    transports : [
        new (DailyRotateFile)({
            filename  : loggingConfig.trainTrackingErrorsLogPath,
            colorize  : false ,
            datePattern : '.yyyy-MM-dd' ,
            stringify : metaDataStringifier ,
            label     : 'TrainTrackingStatsLogger',
        }) ,
    ],
});



//winston.loggers.add('memwatch', {
    //file: {
        //filename : memwatchConfig.logFilePath,
        //level    : 'silly',
        //colorize : false,
        //label    : 'Memory Usage',
    //}
//}).remove(winston.transports.Console);


function metaDataStringifier (options) {
    return JSON.stringify(options.payload);
}


function loggerArgResolver(logger) {
    var loggerName = logger && logger.transports && logger.transports.file && logger.transports.file.label ,
        errorMessage = 'Unrecognized argument type passed to ' + 
                        loggerName ? (' the ' + loggerName) : 'a logger.';

    return function (arg) { 

        if (typeof arg === 'string') {
            logger.log('on', arg) ;
        } else if ((typeof arg === 'object') && (arg !== null)) {
            try {
                logger.on('on', '', arg);
            } catch (e) {
                console.error(e.stack);
            }
        } else {
            console.error(errorMessage);
        }
    } ;
}



module.exports = {
    logDataAnomaly : loggerArgResolver(dataAnomalyLogger) ,
    logError       : loggerArgResolver(errorLogger) ,

    logTrainLocations      : loggerArgResolver(trainLocationsLogger) ,
    logTrainTrackingStats  : loggerArgResolver(trainTrackingStatsLogger) ,
    logUnscheduledTrips    : loggerArgResolver(unscheduledTripsLogger) ,
    logNoSpatialDataTrips  : loggerArgResolver(noSpatialDataTripsLogger) ,
    logTrainTrackingErrors : loggerArgResolver(trainTrackingErrorsLogger) ,

} ;
