'use strict';

var converterEventEmitter = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterEventEmitter ,

    loggingService = require(__dirname + '/MockLoggingService') ;




//==================== Statistics gathering events ====================
function handleTrainLocationUpdateEvent (trainLocations) {
    loggingService.logTrainLocations(trainLocations) ;
}

function handleTrainTrackStatsUpdateEvent (trainTrackingStats) {
    loggingService.logTrainTrackingStats(trainTrackingStats) ;
}

function handleUnscheduleTripsUpdateEvent (unscheduledTrips) {
    loggingService.logUnscheduledTrips(unscheduledTrips) ;
}

function handleNoSpatialDataTripsUpdateEvent (noSpatialDataTrips) {
    loggingService.logNoSpatialDataTrips(noSpatialDataTrips) ;
}

function handleTrainTrackingError (debuggingInfo) {
    loggingService.logTrainTrackingError(debuggingInfo) ;
}


function handleDataAnomaly (anomalyInfo) {
    loggingService.logDataAnomaly(anomalyInfo) ;
}

function handleError (errorInfo) {
    loggingService.logError(errorInfo) ;
}

    

converterEventEmitter.on(converterEventEmitter.eventTypes.LOCATIONS_UPDATE, 
                    handleTrainLocationUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.TRAIN_TRACKING_STATS_UPDATE, 
                    handleTrainTrackStatsUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.UNSCHEDULED_TRIPS_UPDATE, 
                    handleUnscheduleTripsUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.NO_SPATIAL_DATA_TRIPS_UPDATE, 
                    handleNoSpatialDataTripsUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.TRAIN_TRACKING_ERROR, 
                    handleTrainTrackingError);

converterEventEmitter.on(converterEventEmitter.eventTypes.DATA_ANOMALY, 
                    handleDataAnomaly);
converterEventEmitter.on(converterEventEmitter.eventTypes.ERROR, 
                    handleError);
