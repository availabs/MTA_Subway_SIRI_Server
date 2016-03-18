'use strict' ;



var fs = require('fs') ,
    
    configsService = require(__dirname + '/MockConfigsService.js') ,

    loggingConfig = configsService.getLoggingConfig() ;



function logTrainLocations (trainLocations) {
    fs.appendFileSync(loggingConfig.trainLocationsLogPath, JSON.stringify(trainLocations) + '\n');
}

function logTrainTrackingStats (trainTrackingStats) {
    fs.appendFileSync(loggingConfig.trainTrackingStatsLogPath, JSON.stringify(trainTrackingStats) + '\n');
}

function logUnscheduledTrips (unscheduledTrips) {
    fs.appendFileSync(loggingConfig.unscheduledTripsLogPath, JSON.stringify(unscheduledTrips) + '\n');
}

function logNoSpatialDataTrips (noSpatialDataTrips) {
    fs.appendFileSync(loggingConfig.noSpatialDataTripsLogPath, JSON.stringify(noSpatialDataTrips) + '\n');
}

function logTrainTrackingError (debuggingInfo) {
    fs.appendFileSync(loggingConfig.trainTrackingErrorsLogPath, JSON.stringify(debuggingInfo) + '\n');
}

function logDataAnomaly (anomalyInfo) {
    fs.appendFileSync(loggingConfig.dataAnomaliesLogPath, JSON.stringify(anomalyInfo) + '\n');
}

function logError (errorEvent) {
    fs.appendFileSync(loggingConfig.errorsLogPath, JSON.stringify(errorEvent) + '\n');
}



module.exports = {
    logTrainLocations     : logTrainLocations ,
    logTrainTrackingStats : logTrainTrackingStats ,
    logUnscheduledTrips   : logUnscheduledTrips ,
    logNoSpatialDataTrips : logNoSpatialDataTrips ,
    logTrainTrackingError : logTrainTrackingError ,
    logDataAnomaly        : logDataAnomaly ,
    logError              : logError ,
} ;
