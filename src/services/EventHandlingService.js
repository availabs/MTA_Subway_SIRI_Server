'use strict';


var loggingService = require('./LoggingService') ;


function handleGTFSFeedUpdateStatus (feedUpdateStatus) {
    console.log(feedUpdateStatus) ;
}

function handleGTFSrtFeedUpdateStatus (feedUpdateStatus) {
    console.log(feedUpdateStatus) ;
}

function handleTrainLocationUpdateEvent (trainLocations) {
    loggingService.logTrainLocations({ payload: trainLocations }) ;
}

function handleTrainTrackStatsUpdateEvent (trainTrackingStats) {
    loggingService.logTrainTrackingStats({ payload: trainTrackingStats }) ;
}

function handleUnscheduleTripsUpdateEvent (unscheduledTrips) {
    loggingService.logUnscheduledTrips({ payload: unscheduledTrips }) ;
}

function handleNoSpatialDataTripsUpdateEvent (noSpatialDataTrips) {
    loggingService.logNoSpatialDataTrips({ payload: noSpatialDataTrips }) ;
}

function handleTrainTrackingError (debuggingInfo) {
    loggingService.logTrainTrackingError({ payload: debuggingInfo }) ;
}


function handleDataAnomaly (anomalyInfo) {
    loggingService.logDataAnomaly({ payload: anomalyInfo }) ;
}

function handleSystemError (errorInfo) {
    loggingService.logError({ payload: errorInfo }) ;
}


function registerConverterEventListeners (converterEmitter) {
    converterEmitter.on(converterEmitter.eventTypes.LOCATIONS_UPDATE, 
                        handleTrainLocationUpdateEvent);
    converterEmitter.on(converterEmitter.eventTypes.TRAIN_TRACKING_STATS_UPDATE, 
                        handleTrainTrackStatsUpdateEvent);
    converterEmitter.on(converterEmitter.eventTypes.UNSCHEDULED_TRIPS_UPDATE, 
                        handleUnscheduleTripsUpdateEvent);
    converterEmitter.on(converterEmitter.eventTypes.NO_SPATIAL_DATA_TRIPS_UPDATE, 
                        handleNoSpatialDataTripsUpdateEvent);
    converterEmitter.on(converterEmitter.eventTypes.ERROR_UPDATE, 
                        handleTrainTrackingError);
}


function registerGTFSToolkitEventListeners (gtfsToolkitEventEmitter) {
    gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.FEED_UPDATE_STATUS,
                               handleGTFSFeedUpdateStatus) ;

    gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.DATA_ANOMALY, 
                               handleDataAnomaly) ;

    gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.ERROR, 
                               handleSystemError) ;
}

function registerGTFSRealtimeToolkitEventListeners (gtfsrtToolkitEventEmitter) {
    gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.FEED_UPDATE_STATUS,
                                 handleGTFSrtFeedUpdateStatus) ;

    gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.DATA_ANOMALY, 
                               handleDataAnomaly) ;

    gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.ERROR, 
                               handleSystemError) ;
}

module.exports = {
    registerGTFSToolkitEventListeners         : registerGTFSToolkitEventListeners ,
    registerGTFSRealtimeToolkitEventListeners : registerGTFSRealtimeToolkitEventListeners ,
    registerConverterEventListeners           : registerConverterEventListeners ,
} ;
