'use strict'; 


var arrayMaxLength = 25;


var systemStatus = {

        systemStartupStatus : {
            startupLog: [] ,
            loggingConfigStatus: null,
            converterConfigStatus: null,
            activeFeedConfigStatus: null,
        },

        gtfs : {
            handlerConstructionStatusLog : [],
            lastFeedUpdateLog : [] ,
            recentErrors : [] ,
        } ,

        gtfsrt : {
            lastStartedEvent : null ,
            lastStoppedEvent : null ,
            lastConfigUpdateLog : [] ,
            recentErrors : [] ,
            lastSuccessfulReadEvent : null ,
        } ,

        converter : {
            lastStartedEvent : null ,
            lastStoppedEvent : null ,
            lastConfigUpdateLog : [] ,
            serviceStatusLog: [] ,
            recentErrors : [] ,
        } ,

        recentDataAnomalies : [] ,

        recentErrors : [] ,
} ;




function logStartupEvent (event) {
    var log = systemStatus.systemStartupStatus.startupLog;
    
    log.push(event) ;    
    sortDescendingByTimestamp(log) ;
}

function updateStartupLoggingConfigStatus (event) {
    logStartupEvent(event);
    systemStatus.systemStartupStatus.loggingConfigStatus = event; 
}

function updateStartupServerConfigStatus (event) {
    logStartupEvent(event);
    systemStatus.systemStartupStatus.converterConfigStatus = event; 
}

function updateStartupActiveFeedConfigStatus (event) {
    logStartupEvent(event);
    systemStatus.systemStartupStatus.activeFeedConfigStatus = event; 
}



function getSystemStatus () {
    return systemStatus ;
}



function resetGTFSFeedHandlerConstructionLog () {
    systemStatus.gtfs.handlerConstructionStatusLog.length = 0 ;
}

function logGTFSFeedHandlerConstructionEvent (event) {
    systemStatus.gtfs.handlerConstructionStatusLog.push(event) ;    
    sortDescendingByTimestamp(systemStatus.gtfs.handlerConstructionStatusLog) ;
}

function resetGTFSFeedUpdateLog () { 
    systemStatus.gtfs.lastFeedUpdateLog.length = 0; 
}

function addEventToGTFSFeedUpdateLog (event) {
    systemStatus.gtfs.lastFeedUpdateLog.push(event) ;
    sortDescendingByTimestamp(systemStatus.gtfs.lastFeedUpdateLog);
}

function addErrorToGTFSStatus (error) {
    systemStatus.gtfs.recentErrors.push(error) ;
    sortDescendingByTimestamp(systemStatus.gtfs.recentErrors);
    systemStatus.gtfs.recentErrors.length = arrayMaxLength ;
}



function logGTFSrtFeedReaderStartedEvent (event) {
    systemStatus.gtfsrt.lastStartedEvent = event ;
}

function logGTFSrtFeedReaderStoppedEvent (event) {
    systemStatus.gtfsrt.lastStoppedEvent = event ;
}
function logGTFSrtFeedReaderSuccessfulReadEvent (event) {
    systemStatus.gtfsrt.lastSuccessfulReadEvent = event ;
}

function resetGTFSRealtimeConfigUpdateLog () { 
    systemStatus.gtfsrt.lastConfigUpdateLog.length = 0; 
}

function addEventToGTFSRealtimeConfigUpdateLog (event) {
    systemStatus.gtfsrt.lastConfigUpdateLog.push(event) ;
    sortDescendingByTimestamp(systemStatus.gtfsrt.lastConfigUpdateLog);
}

function addErrorToGTFSRealtimeStatus (error) {
    systemStatus.gtfsrt.recentErrors.push(error) ;
    sortDescendingByTimestamp(systemStatus.gtfsrt.recentErrors);
    systemStatus.gtfsrt.recentErrors.length = arrayMaxLength ;
}



function logConverterServiceStartedEvent (serviceStartedEvent) {
    systemStatus.converter.lastStartedEvent = serviceStartedEvent ;
}

function logConverterServiceStoppedEvent (serviceStoppedEvent) {
    systemStatus.converter.lastStoppedEvent = serviceStoppedEvent ;
}

function resetConverterConfigUpdateLog () { 
    systemStatus.converter.lastConfigUpdateLog.length = 0; 
}

function addEventToConverterConfigUpdateLog (event) {
    systemStatus.converter.lastConfigUpdateLog.push(event) ;
    sortDescendingByTimestamp(systemStatus.converter.lastConfigUpdateLog);
}

function addEventToConverterServiceStatusLog (event) {
    systemStatus.converter.serviceStatusLog.push(event) ;
    sortDescendingByTimestamp(systemStatus.converter.serviceStatusLog);
}

function addErrorToConverterStatus (error) {
    systemStatus.converter.recentErrors.push(error) ;
    sortDescendingByTimestamp(systemStatus.gtfs.recentErrors);
    systemStatus.converter.recentErrors.length = arrayMaxLength ;
}



function addDataAnomaly (anomaly) {
    systemStatus.recentDataAnomalies.push(anomaly) ;
    sortDescendingByTimestamp(systemStatus.recentDataAnomalies);
    systemStatus.recentDataAnomalies.length = arrayMaxLength ;
}

function addError (error) {
    systemStatus.recentErrors.push(error) ;
    sortDescendingByTimestamp(systemStatus.recentErrors);
    systemStatus.recentErrors.length = arrayMaxLength ;
}



function descendingTimestampComparator (a, b) {
    if (!a && !b) { return 0; }
    else if (a && !b) { return -1; }
    else if (!a && b) { return 1; }
    else if (a.timestamp && !b.timestamp) { return -1; }
    else if (!a.timestamp && b.timestamp) { return 1; }
    else { return b.timestamp - a.timestamp; }
}

function sortDescendingByTimestamp (arr) {
    arr.sort(descendingTimestampComparator);
}



module.exports = {

    updateStartupLoggingConfigStatus       : updateStartupLoggingConfigStatus ,
    updateStartupServerConfigStatus        : updateStartupServerConfigStatus ,
    updateStartupActiveFeedConfigStatus    : updateStartupActiveFeedConfigStatus ,

    getSystemStatus                        : getSystemStatus ,

    resetGTFSFeedHandlerConstructionLog    : resetGTFSFeedHandlerConstructionLog ,
    logGTFSFeedHandlerConstructionEvent    : logGTFSFeedHandlerConstructionEvent ,

    resetGTFSFeedUpdateLog                 : resetGTFSFeedUpdateLog ,
    addEventToGTFSFeedUpdateLog            : addEventToGTFSFeedUpdateLog ,

    resetGTFSRealtimeConfigUpdateLog       : resetGTFSRealtimeConfigUpdateLog ,
    addEventToGTFSRealtimeConfigUpdateLog  : addEventToGTFSRealtimeConfigUpdateLog ,

    logGTFSrtFeedReaderStartedEvent        : logGTFSrtFeedReaderStartedEvent ,
    logGTFSrtFeedReaderStoppedEvent        : logGTFSrtFeedReaderStoppedEvent ,

    logGTFSrtFeedReaderSuccessfulReadEvent : logGTFSrtFeedReaderSuccessfulReadEvent ,


    logConverterServiceStartedEvent        : logConverterServiceStartedEvent ,
    logConverterServiceStoppedEvent        : logConverterServiceStoppedEvent ,

    resetConverterConfigUpdateLog          : resetConverterConfigUpdateLog ,
    addEventToConverterConfigUpdateLog     : addEventToConverterConfigUpdateLog ,
    addEventToConverterServiceStatusLog    : addEventToConverterServiceStatusLog ,

    addErrorToGTFSStatus                   : addErrorToGTFSStatus ,
    addErrorToGTFSRealtimeStatus           : addErrorToGTFSRealtimeStatus ,
    addErrorToConverterStatus              : addErrorToConverterStatus ,

    addDataAnomaly                         : addDataAnomaly ,
    addError                               : addError ,
} ;
