'use strict';


var SystemStatusService = require('./SystemStatusService') ,

    serverEventEmitter        = require('../events/ServerEventEmitter') ,
    gtfsToolkitEventEmitter   = require('MTA_Subway_GTFS_Toolkit').ToolkitEventEmitter ,
    gtfsrtToolkitEventEmitter = require('MTA_Subway_GTFS-Realtime_Toolkit').ToolkitEventEmitter ,
    converterEventEmitter     = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterEventEmitter ,

    loggingService = require('./LoggingService') ;



function handleStartupLoggingConfigStatus (event) {
    SystemStatusService.updateStartupLoggingConfigStatus(event);
    console.log(event) ;
}

function handleStartupServerConfigStatus (event) {
    SystemStatusService.updateStartupServerConfigStatus(event);
}

function handleStartupActiveFeedConfigStatus (event) {
    SystemStatusService.updateStartupActiveFeedConfigStatus(event);
}


//==================== GTFS events ====================
function handleGTFSFeedConstructionStatusUpdate (constructionStatusUpdate) {
    SystemStatusService.logGTFSFeedHandlerConstructionEvent(constructionStatusUpdate) ;
    console.log(constructionStatusUpdate) ;
}

function handleGTFSFeedUpdateStatus (feedUpdateStatus) {
    SystemStatusService.addEventToGTFSFeedUpdateLog(feedUpdateStatus) ;
    console.log(feedUpdateStatus) ;
}

function handleGTFSrtFeedUpdateStatus (feedUpdateStatus) {
    SystemStatusService.addEventToGTFSRealtimeConfigUpdateLog(feedUpdateStatus) ;
    console.log(feedUpdateStatus) ;
}



//==================== GTFS-Realtime events ====================

function handleGTFSrtFeedReaderStarted (feedReaderStartedEvent) {
    SystemStatusService.logGTFSrtFeedReaderStartedEvent(feedReaderStartedEvent) ;
}

function handleGTFSrtFeedReaderStopped (feedReaderStoppedEvent) {
    SystemStatusService.logGTFSrtFeedReaderStoppedEvent(feedReaderStoppedEvent) ;
}

function handleGTFSrtFeedReaderSuccessfulRead (successfulReadEvent) {
    SystemStatusService.logGTFSrtFeedReaderSuccessfulReadEvent(successfulReadEvent) ;
}



//==================== Converter events ====================
function handleConverterServiceStarted (serviceStartedEvent) {
    SystemStatusService.logConverterServiceStartedEvent(serviceStartedEvent) ;
    console.log(serviceStartedEvent) ;
}

function handleConverterServiceStopped (serviceStoppedEvent) {
    SystemStatusService.logConverterServiceStoppedEvent(serviceStoppedEvent) ;
    console.log(serviceStoppedEvent) ;
}

function handleConverterConfigUpdateStatus (feedUpdateStatus) {
    SystemStatusService.addEventToConverterConfigUpdateLog(feedUpdateStatus) ;
    console.log(feedUpdateStatus) ;
}

function handleConverterServiceStatusUpdate (serviceUpdate) {
    SystemStatusService.addEventToConverterServiceStatusLog(serviceUpdate) ;
    console.log(serviceUpdate) ;
}



//==================== Statistics gathering events ====================
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

function handleTrainTrackingErrors (debuggingInfo) {
    loggingService.logTrainTrackingError({ payload: debuggingInfo }) ;
}


function handleDataAnomaly (anomalyInfo) {
    loggingService.logDataAnomaly({ payload: anomalyInfo }) ;
}

function handleSystemError (errorEvent) {
    loggingService.logError({ payload: errorEvent }) ;

    SystemStatusService.addError(errorEvent) ;
}


gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.FEED_HANDLER_CONSTRUCTION_STATUS,
                           handleGTFSFeedConstructionStatusUpdate) ;

gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.FEED_UPDATE_STATUS,
                           handleGTFSFeedUpdateStatus) ;

gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.DATA_ANOMALY, 
                           handleDataAnomaly) ;

gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.ERROR, 
                           handleSystemError) ;



gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.FEED_READER_STARTED,
                             handleGTFSrtFeedReaderStarted) ;
gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.FEED_READER_STOPPED,
                             handleGTFSrtFeedReaderStopped) ;

gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.FEED_READER_SUCCESSFUL_READ,
                             handleGTFSrtFeedReaderSuccessfulRead) ;

gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.FEED_UPDATE_STATUS,
                             handleGTFSrtFeedUpdateStatus) ;

gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.DATA_ANOMALY, 
                             handleDataAnomaly) ;

gtfsrtToolkitEventEmitter.on(gtfsrtToolkitEventEmitter.eventTypes.ERROR, 
                             handleSystemError) ;



converterEventEmitter.on(converterEventEmitter.eventTypes.LOCATIONS_UPDATE, 
                         handleTrainLocationUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.TRAIN_TRACKING_STATS_UPDATE, 
                         handleTrainTrackStatsUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.UNSCHEDULED_TRIPS_UPDATE, 
                         handleUnscheduleTripsUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.NO_SPATIAL_DATA_TRIPS_UPDATE, 
                         handleNoSpatialDataTripsUpdateEvent);
converterEventEmitter.on(converterEventEmitter.eventTypes.TRAIN_TRACKING_ERROR, 
                         handleTrainTrackingErrors);



serverEventEmitter.on(serverEventEmitter.eventTypes.STARTUP_LOGGING_CONFIG_STATUS,
                     handleStartupLoggingConfigStatus) ; 
serverEventEmitter.on(serverEventEmitter.eventTypes.STARTUP_SERVER_CONFIG_STATUS,
                     handleStartupServerConfigStatus) ; 
serverEventEmitter.on(serverEventEmitter.eventTypes.STARTUP_ACTIVE_FEED_CONFIG_STATUS,
                     handleStartupActiveFeedConfigStatus) ; 

serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_FEED_UPDATE_STATUS,
                     handleGTFSFeedUpdateStatus) ; 
serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_REALTIME_FEED_UPDATE_STATUS,
                     handleGTFSrtFeedUpdateStatus) ; 

serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_STARTED,
                     handleConverterServiceStarted) ; 
serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_STOPPED,
                     handleConverterServiceStopped) ; 
serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_CONFIG_UPDATE_STATUS,
                     handleConverterConfigUpdateStatus) ; 
serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_STATUS,
                     handleConverterServiceStatusUpdate) ; 


