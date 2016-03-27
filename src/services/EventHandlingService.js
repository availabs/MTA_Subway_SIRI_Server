'use strict';


var SystemStatusService = require('./SystemStatusService') ,

    serverEventEmitter        = require('../events/ServerEventEmitter') ,
    gtfsToolkitEventEmitter   = require('MTA_Subway_GTFS_Toolkit').ToolkitEventEmitter ,
    gtfsrtToolkitEventEmitter = require('MTA_Subway_GTFS-Realtime_Toolkit').ToolkitEventEmitter ,
    converterEventEmitter     = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterEventEmitter ,

    loggingService = require('./LoggingService') ;





function handleSystemStatusUpdate (update) {
    SystemStatusService.updateSystemStatusLog(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleSystemConfigStatusUpdate (update) {
    SystemStatusService.updateSystemConfigStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleLoggingServiceStatusUpdate (update) {
    SystemStatusService.updateLoggingStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleLoggingConfigStatusUpdate (update) {
    SystemStatusService.updateLoggingConfigStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleGTFSServiceStatusUpdate (update) {
    SystemStatusService.updateGTFSStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleGTFSServiceConfigStatusUpdate (update) {
    SystemStatusService.updateGTFSConfigStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleGTFSLastDataUpdateLogReset () {
    SystemStatusService.resetGTFSLastDataUpdateLog();
}

function handleGTFSDataUpdateStatusUpdate (update) {
    SystemStatusService.updateGTFSStatus(update);
    SystemStatusService.updateGTFSLastDataUpdateLog(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleGTFSRealtimeServiceStatusUpdate (update) {
    SystemStatusService.updateGTFSRealtimeStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleGTFSRealtimeServiceConfigStatusUpdate (update) {
    SystemStatusService.updateGTFSRealtimeConfigStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleConverterServiceStatusUpdate (update) {
    SystemStatusService.updateConverterStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleConverterServiceConfigStatusUpdate (update) {
    SystemStatusService.updateConverterConfigStatus(update);
    loggingService.logSystemStatusUpdate({ payload: update });
}

function handleConverterServiceStartedEvent (startEvent) {
    SystemStatusService.logConverterServiceStartedEvent(startEvent);
    loggingService.logSystemStatusUpdate({ payload: startEvent });
}

function handleConverterServiceStoppedEvent (stopEvent) {
    SystemStatusService.logConverterServiceStoppedEvent(stopEvent);
    loggingService.logSystemStatusUpdate({ payload: stopEvent });
}


//==================== GTFS events ====================
function handleGTFSFeedConstructionStatusUpdate (constructionStatusUpdate) {
    SystemStatusService.updateGTFSStatus(constructionStatusUpdate) ;
    loggingService.logSystemStatusUpdate({ payload: constructionStatusUpdate });
}




//==================== GTFS-Realtime events ====================

function handleGTFSrtFeedReaderStarted (feedReaderStartedEvent) {
    SystemStatusService.updateGTFSRealtimeStatus(feedReaderStartedEvent) ;
    loggingService.logSystemStatusUpdate({ payload: feedReaderStartedEvent });
}

function handleGTFSrtFeedReaderStopped (feedReaderStoppedEvent) {
    SystemStatusService.updateGTFSRealtimeStatus(feedReaderStoppedEvent) ;
    loggingService.logSystemStatusUpdate({ payload: feedReaderStoppedEvent });
}

function handleGTFSrtFeedReaderSuccessfulRead (successfulReadEvent) {
    SystemStatusService.logGTFSrtFeedReaderSuccessfulReadEvent(successfulReadEvent) ;
    loggingService.logSystemStatusUpdate({ payload: successfulReadEvent });
}

function handleGTFSrtFeedUpdateStatus (feedUpdateStatus) {
    SystemStatusService.updateGTFSRealtimeStatus(feedUpdateStatus) ;
    loggingService.logSystemStatusUpdate({ payload: feedUpdateStatus });
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
    SystemStatusService.logAnomaly(anomalyInfo) ;
}

function handleSystemError (errorEvent) {
    loggingService.logError({ payload: errorEvent }) ;

    SystemStatusService.logError(errorEvent) ;
}


gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.FEED_HANDLER_CONSTRUCTION_STATUS,
                           handleGTFSFeedConstructionStatusUpdate) ;

gtfsToolkitEventEmitter.on(gtfsToolkitEventEmitter.eventTypes.FEED_UPDATE_STATUS,
                           handleGTFSDataUpdateStatusUpdate) ;

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


serverEventEmitter.on(serverEventEmitter.eventTypes.SYSTEM_STATUS,
                      handleSystemStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.SYSTEM_CONFIG_STATUS,
                      handleSystemConfigStatusUpdate) ;

serverEventEmitter.on(serverEventEmitter.eventTypes.LOGGING_SERVICE_STATUS,
                      handleLoggingServiceStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.LOGGING_CONFIG_STATUS,
                      handleLoggingConfigStatusUpdate) ;

serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_SERVICE_STATUS,
                      handleGTFSServiceStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_SERVICE_CONFIG_STATUS,
                      handleGTFSServiceConfigStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_SERVICE_START_DATA_UPDATE,
                      handleGTFSLastDataUpdateLogReset);
serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_DATA_UPDATE_STATUS,
                      handleGTFSDataUpdateStatusUpdate) ;

serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_REALTIME_SERVICE_STATUS,
                      handleGTFSRealtimeServiceStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.GTFS_REALTIME_SERVICE_CONFIG_STATUS,
                      handleGTFSRealtimeServiceConfigStatusUpdate) ;

serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_STATUS,
                      handleConverterServiceStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_CONFIG_STATUS,
                      handleConverterServiceConfigStatusUpdate) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_STARTED,
                      handleConverterServiceStartedEvent) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.CONVERTER_SERVICE_STOPPED,
                      handleConverterServiceStoppedEvent) ;

serverEventEmitter.on(serverEventEmitter.eventTypes.DATA_ANOMALY,
                      handleDataAnomaly) ;
serverEventEmitter.on(serverEventEmitter.eventTypes.ERROR,
                      handleSystemError) ;


