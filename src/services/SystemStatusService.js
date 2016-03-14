'use strict'; 


var arrayMaxLength = 25;


var systemStatus = {
        gtfs : {
            lastFeedUpdateLog : [] ,
            recentErrors : [] ,
        } ,

        gtfsrt : {
            lastStartedEvent : null ,
            lastStoppedEvent : null ,
            lastConfigUpdateLog : [] ,
            recentErrors : [] ,
            lastSuccessfulMessageReadTimestamp : null ,
        } ,

        converter : {
            lastConfigUpdateLog : [] ,
            recentErrors : [] ,
        } ,

        recentDataAnomalies : [] ,

        recentErrors : [] ,
} ;


function getSystemStatus () {
    return systemStatus ;
}

function logGTFSrtFeedReaderStartedEvent (event) {
    systemStatus.gtfsrt.lastStartedEvent = event;
}

function logGTFSrtFeedReaderStoppedEvent (event) {
    systemStatus.gtfsrt.lastStoppedEvent = event;
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


function resetConverterConfigUpdateLog () { 
    systemStatus.converter.lastConfigUpdateLog.length = 0; 
}

function addEventToConverterConfigUpdateLog (event) {
    systemStatus.converter.lastConfigUpdateLog.push(event) ;
    sortDescendingByTimestamp(systemStatus.converter.lastConfigUpdateLog);
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
    systemStatus.errors.push(error) ;
    sortDescendingByTimestamp(systemStatus.recentErrors);
    systemStatus.errors.length = arrayMaxLength ;
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
    getSystemStatus                       : getSystemStatus ,

    logGTFSrtFeedReaderStartedEvent       : logGTFSrtFeedReaderStartedEvent ,
    logGTFSrtFeedReaderStoppedEvent       : logGTFSrtFeedReaderStoppedEvent ,

    resetGTFSFeedUpdateLog                : resetGTFSFeedUpdateLog ,
    addEventToGTFSFeedUpdateLog           : addEventToGTFSFeedUpdateLog ,

    resetGTFSRealtimeConfigUpdateLog      : resetGTFSRealtimeConfigUpdateLog ,
    addEventToGTFSRealtimeConfigUpdateLog : addEventToGTFSRealtimeConfigUpdateLog ,

    resetConverterConfigUpdateLog         : resetConverterConfigUpdateLog ,
    addEventToConverterConfigUpdateLog    : addEventToConverterConfigUpdateLog ,

    addErrorToGTFSStatus                  : addErrorToGTFSStatus ,
    addErrorToGTFSRealtimeStatus          : addErrorToGTFSRealtimeStatus ,
    addErrorToConverterStatus             : addErrorToConverterStatus ,

    addDataAnomaly                        : addDataAnomaly ,
    addError                              : addError ,
} ;
