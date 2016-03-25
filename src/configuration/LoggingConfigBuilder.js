'use strict';



var path  = require('path') ,

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
    ];


function validateHotConfigSync (hotConfig) {

    var validationMessage = { __isValid: true } ;

    if (!hotConfig) { 
        validationMessage.configuration = { 
            info: 'Empty logging config object turns off all logging.' ,
        };

        return validationMessage ;

    } else if (Object.prototype.toString.call(hotConfig) !== '[object Object]') {
        validationMessage.configuration = { 
            error: 'The logging config should be a simple Object.' ,
        };
        validationMessage.__isValid = false;

        return validationMessage ;
    }

    var given = Object.keys(hotConfig) ,
        unsupported = _.difference(given, supportedLoggingOptions) ;

    if (unsupported.length) {
        validationMessage.unsupportedLoggingOptions = { 
            warn: 'The following logging options are not supported:\n\t' + unsupported.join(', ') + '.' 
        };
    }

    return validationMessage;
}

function validateHotConfig (hotConfig, callback) {
    process.nextTick(function () { callback(validateHotConfigSync(hotConfig)); });
}

function build (hotConfig, serverConfig) {
    var activeFeed = serverConfig.activeFeed;

    var paths = {

        logsDir:                     logsDir ,

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

        serverAccessLogPath:         path.join(logsDir, activeFeed + '_serverAccess.log') ,
    } ;
 
    return _.merge(paths, hotConfig) ;
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build           : build ,
} ;
