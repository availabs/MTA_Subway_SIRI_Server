'use strict';



var path  = require('path') ,

    merge = require('merge') ,

    _ = require('lodash') ,

    projectRoot = path.join(__dirname, '../../') ,

    logsDir = path.join(projectRoot, '/logs') ,

    supportedLoggingOptions = [
        "logIndexingStatistics",
        "logDataAnomalies",
        "logErrors",
        "logTrainLocations",
        "logTrainTrackingStats",
        "logUnscheduledTrips",
        "logNoSpatialDataTrips",
        "logTrainTrackingErrors",
        "logMemoryUsage",
        "logFeedReader" ,
    ].sort();


function validateHotConfigSync (hotConfig) {


    if (!hotConfig) { 
        return { configuration: { info: 'Empty logging config object turns off all logging.' } };
    } else if (Object.prototype.toString.call(hotConfig) !== '[object Object]') {
        return { configuration: { error: 'The logging config should be a simple Object.' } };
    }

    var validationMessage = {} ,
        given = Object.keys(hotConfig) ,
        unsupported = _.difference(given, supportedLoggingOptions) ;

    if (unsupported.length) {
        validationMessage.unsupportedLoggingOptions = 
            { warn: 'The following logging options are not supported:\n\t' + unsupported.join(', ') + '.' };
    }

    return validationMessage;
}

function validateHotConfig (hotConfig, callback) {
    process.nextTick(function () { callback(validateHotConfigSync(hotConfig)); });
}

function build (hotConfig, serverConfig) {
    var activeFeed   = serverConfig.activeFeed;

    var paths = {
        indexingStatisticsLogPath:   path.join(logsDir, activeFeed + '_spatialDataIndexingStats.txt') ,

        dataAnomaliesLogPath:        path.join(logsDir, activeFeed + '_dataAnomalies.log') ,

        errorsLogPath:               path.join(logsDir, activeFeed + '_errors.log') ,

        feedReaderLogPath:           path.join(logsDir, activeFeed + '_gtfsrtFeedReader.log') ,

        converterLogPath:            path.join(logsDir, activeFeed + '_converter.log') ,

        trainLocationsLogPath:       path.join(logsDir, activeFeed + '_trainLocations.log') ,

        trainTrackingStatsLogPath:   path.join(logsDir, activeFeed + '_trainTrackingStats.log') ,

        unscheduledTripsLogPath:     path.join(logsDir, activeFeed + '_unscheduledTrips.log') ,

        noSpatialDataTripsLogPath:   path.join(logsDir, activeFeed + '_noSpatialDataTrips.log') ,

        trainTrackingErrorsLogPath:  path.join(logsDir, activeFeed + '_trainTrackingErrors.log'),

        memwatchLogPath:             path.join(logsDir, 'memwatch.log') ,

        serverAccessLogPath:         path.join(logsDir, activeFeed + '_serverAccess.log') ,
    } ;
 
    return merge(true, paths, hotConfig) ;
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build           : build ,
} ;
