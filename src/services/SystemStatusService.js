'use strict'; 


var _ = require('lodash') ,

    ConverterService = require('./ConverterService') ;



var arrayMaxLength = 100;


    var system = {
        statusLog: [] ,
        configStatus: null,
    },

    logging = {
        statusLog: [],
        configStatus: null,
    },

    gtfs = {
        statusLog: [],
        configStatus: null,
        lastDataUpdateLog : [] ,
    } ,

    gtfsrt = {
        statusLog: [] ,
        configStatus : null ,
        lastSuccessfulReadEvent : null ,
    } ,

    converter = {
        lastStartedEvent : null ,
        lastStoppedEvent : null ,
        statusLog: [] ,
        configStatus : null,
    } ,

    recentDataAnomalies = [] ,

    recentErrors = [] ;


function addToLog (log, update) {
    log.push(update);
    sortDescendingByTimestamp(log);
    if (log.length > arrayMaxLength) {
        log.length = arrayMaxLength;
    }
}



//==================== System ==================== 
function updateSystemStatusLog (update) {
    addToLog(system.statusLog, update) ;
}

function updateSystemConfigStatus (update) {
    system.configStatus = update ;
}


//==================== Logging ==================== 
function updateLoggingStatus (update) {
    addToLog(logging.statusLog, update) ;
}

function updateLoggingConfigStatus (update) {
    logging.configStatus = update;
}



//==================== GTFS ==================== 
function updateGTFSStatus (update) {
    addToLog(gtfs.statusLog, update) ;
}

function updateGTFSConfigStatus (update) {
    gtfs.configStatus = update;
}

function resetGTFSLastDataUpdateLog () {
    gtfs.lastDataUpdateLog.length = 0 ;
}

function updateGTFSLastDataUpdateLog (update) {
    addToLog(gtfs.lastDataUpdateLog, update) ;
}


//==================== GTFS-Realtime ==================== 
function updateGTFSRealtimeStatus (update) {
    addToLog(gtfsrt.statusLog, update) ;
}

function updateGTFSRealtimeConfigStatus (update) {
    gtfsrt.configStatus = update;
}

function logGTFSrtFeedReaderSuccessfulReadEvent (event) {
    gtfsrt.lastSuccessfulReadEvent = event ;
}


//==================== Converter ==================== 
function logConverterServiceStartedEvent (serviceStartedEvent) {
    converter.lastStartedEvent = serviceStartedEvent ;
}

function logConverterServiceStoppedEvent (serviceStoppedEvent) {
    converter.lastStoppedEvent = serviceStoppedEvent ;
}

function updateConverterStatus (update) {
    addToLog(converter.statusLog, update) ;
}

function updateConverterConfigStatus (update) {
    converter.configStatus = update;
}



function logAnomaly (anomaly) {
    addToLog(recentDataAnomalies, anomaly) ;
}

function logError (error) {
    addToLog(recentErrors, error) ;
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


function getSystemStatus () {
    var converterState = _.clone(converter);

    converterState.isRunning = ConverterService.isRunning() ;

    return {
        system : system ,
        logging : logging ,
        gtfs : gtfs ,
        gtfsrt : gtfsrt ,
        converter : converterState ,
        recentDataAnomalies : recentDataAnomalies ,
        recentErrors : recentErrors ,
    };
}


module.exports = {

    getSystemStatus : getSystemStatus,

	updateSystemStatusLog                  : updateSystemStatusLog ,
	updateSystemConfigStatus               : updateSystemConfigStatus ,
	updateLoggingStatus                    : updateLoggingStatus ,
	updateLoggingConfigStatus              : updateLoggingConfigStatus ,
	updateGTFSStatus                       : updateGTFSStatus ,
	updateGTFSConfigStatus                 : updateGTFSConfigStatus ,
	resetGTFSLastDataUpdateLog             : resetGTFSLastDataUpdateLog ,
	updateGTFSLastDataUpdateLog            : updateGTFSLastDataUpdateLog ,
	updateGTFSRealtimeStatus               : updateGTFSRealtimeStatus ,
	updateGTFSRealtimeConfigStatus         : updateGTFSRealtimeConfigStatus ,

	logGTFSrtFeedReaderSuccessfulReadEvent : logGTFSrtFeedReaderSuccessfulReadEvent ,
	logConverterServiceStartedEvent        : logConverterServiceStartedEvent ,
	logConverterServiceStoppedEvent        : logConverterServiceStoppedEvent ,

	updateConverterStatus                  : updateConverterStatus ,
	updateConverterConfigStatus            : updateConverterConfigStatus ,
	logAnomaly                             : logAnomaly ,
	logError                               : logError ,

} ;

