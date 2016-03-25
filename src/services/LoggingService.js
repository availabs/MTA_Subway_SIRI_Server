'use strict';


var fs = require('fs') ,
    path = require('path') ,
    winston = require('winston') ,
    DailyRotateFile = require('winston-daily-rotate-file') ,


    mkdirp = require('mkdirp') ,

    moment = require('moment') ,

    schedule = require('node-schedule');



var ConfigsService = require('./ConfigsService') ,

    loggingConfig = ConfigsService.getLoggingConfig() ,

    logsDir = loggingConfig.logsDir ,

    daysToKeepLogsBeforeDeleting = parseInt(loggingConfig.daysToKeepLogsBeforeDeleting) ,

    logRollerScheduledJob ;



mkdirp.sync(logsDir) ;


var binaryLoggingLevels = {
        off : 0 ,
        on  : 1 ,
    } ;



var systemStatusUpdateLogger = new (winston.Logger)({
    levels : binaryLoggingLevels ,
    level  : 'on' ,
    exitOnError: false,

    transports: [
        new (winston.transports.Console)({
            showLevel : false ,
            json      : true ,
            stringify : function (obj) { return JSON.stringify(obj.payload); } ,
        }), 
    ]
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
    level  : loggingConfig.logUnscheduledTrips ? 'on' : 'off',
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
    level  : loggingConfig.logNoSpatialDataTrips ? 'on' : 'off',
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


var trainTrackingErrorLogger = new (winston.Logger)({
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
                logger.log('on', '', arg);
            } catch (e) {
                console.error(e.stack);
            }
        } else {
            console.error(errorMessage);
        }
    } ;
}


function logRoller () {

    fs.readdir(logsDir, function (err, files) {
        if (err) {
            console.err('Could not read the logs directory.') ;
            return ;
        }

        var cutoffDate = moment().startOf('day').subtract(daysToKeepLogsBeforeDeleting + 1, 'days') ,
            toDelete = [],
            dateSuffix,
            i;

        for ( i = 1; i < files.length; ++i ) {
            
            dateSuffix = files[i].match(/^.*\.(.*)$/)[1]; // http://stackoverflow.com/a/10767838

            if (moment(new Date(dateSuffix)).isBefore(cutoffDate)) {
                toDelete.push(path.join(logsDir, files[i]));
            }
        }

        function deleteFile (i) {
            if (i === toDelete.length) {
                console.log('Logroller DONE.');
                return;
            }   

            fs.unlink(toDelete[i], function () {
                deleteFile(++i);
            });
        }

        deleteFile(0);
    }) ;
}


function scheduleTheLogRollingJob () {
    if (!isNaN(daysToKeepLogsBeforeDeleting)) {
        // At 00:10:10  each morning, run the log roller.
        // The 10 mins and 10 secs is to give Winston time to switch to the new date. 
        //logRollerScheduledJob = schedule.scheduleJob('10 10 * * * *', logRoller);
        logRollerScheduledJob = schedule.scheduleJob('10 10 * * * *', logRoller);
    }
}

scheduleTheLogRollingJob() ;


function loggingConfigUpdateListener (newLoggingConfig) {

    try {
        var newDaysToKeepLogs = parseInt(newLoggingConfig && newLoggingConfig.daysToKeepLogsBeforeDeleting) ,
            daysToKeepLogsChanged = (daysToKeepLogsBeforeDeleting !== newDaysToKeepLogs);

        loggingConfig = newLoggingConfig ;

        if (daysToKeepLogsChanged) {
            daysToKeepLogsChanged = newDaysToKeepLogs;
            if (logRollerScheduledJob) {
                logRollerScheduledJob.cancel();
            }
            scheduleTheLogRollingJob();
        } 

        dataAnomalyLogger.transports.dailyRotateFile.level        = (loggingConfig.logDataAnomalies) ?'on':'off';
        errorLogger.transports.dailyRotateFile.level              = (loggingConfig.logErrors) ?'on':'off';
        trainLocationsLogger.transports.dailyRotateFile.level     = (loggingConfig.logTrainLocations) ?'on':'off';
        trainTrackingStatsLogger.transports.dailyRotateFile.level = (loggingConfig.logTrainTrackingStats) ?'on':'off';
        unscheduledTripsLogger.transports.dailyRotateFile.level   = (loggingConfig.logUnscheduledTrips) ?'on':'off';
        noSpatialDataTripsLogger.transports.dailyRotateFile.level = (loggingConfig.logNoSpatialDataTrips) ?'on':'off';
        trainTrackingErrorLogger.transports.dailyRotateFile.level = (loggingConfig.logTrainTrackingErrors) ?'on':'off';

    } catch (err) {
        console.log(err) ;
        throw err;
    }
}

ConfigsService.addLoggingConfigUpdateListener(loggingConfigUpdateListener) ;


module.exports = {
    logSystemStatusUpdate : loggerArgResolver(systemStatusUpdateLogger) ,

    logDataAnomaly        : loggerArgResolver(dataAnomalyLogger) ,
    logError              : loggerArgResolver(errorLogger) ,

    logTrainLocations     : loggerArgResolver(trainLocationsLogger) ,
    logTrainTrackingStats : loggerArgResolver(trainTrackingStatsLogger) ,
    logUnscheduledTrips   : loggerArgResolver(unscheduledTripsLogger) ,
    logNoSpatialDataTrips : loggerArgResolver(noSpatialDataTripsLogger) ,
    logTrainTrackingError : loggerArgResolver(trainTrackingErrorLogger) ,
} ;


