'use strict';


// NOTE: The process.nextTick calls are to solve the following problem:
//          The EventHandlerService depends on the LoggingService depends on the ConfigsService
//          This means the EventHandlerService is not running when the ConfigsService is firing off
//              its initialization events. The process.nextTick calls seems to solve this.

var process = require('process') ,

    eventEmitter = require('./ServerEventEmitter.js') ;


module.exports = {


    //----------------- Server-related events -----------------
    emitSystemStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.SYSTEM_STATUS, payload) ;
        });
    } ,

    emitSystemConfigStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.SYSTEM_CONFIG_STATUS, payload) ;
        });
    } ,


    //----------------- Logging-related events -----------------
    emitLoggingStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.LOGGING_SERVICE_STATUS, payload) ;
        });
    } ,

    emitLoggingConfigStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.LOGGING_CONFIG_STATUS, payload) ;
        });
    } ,


    //----------------- GTFSFeedService-related events -----------------
    emitGTFSServiceStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.GTFS_SERVICE_STATUS, payload) ;
        });
    },
    
    emitGTFSServiceConfigStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.GTFS_SERVICE_CONFIG_STATUS, payload) ;
        });
    },
    
    emitGTFSDataUpdateStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.GTFS_DATA_UPDATE_STATUS, payload) ;
        });
    },


    //----------------- GTFSRealtimeFeedService-related events -----------------
    emitGTFSRealtimeServiceStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.GTFS_REALTIME_SERVICE_STATUS, payload) ;
        });
    },
    
    emitGTFSRealtimeServiceConfigStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.GTFS_REALTIME_SERVICE_CONFIG_STATUS, payload) ;
        });
    },


    //----------------- ConverterService-related events -----------------
    emitConverterServiceStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STATUS, payload) ;
        });
    },
    
    emitConverterServiceConfigStatus : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_CONFIG_STATUS, payload) ;
        });
    },

    emitConverterServiceStartedEvent : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STARTED, payload) ;
        });
    } ,

    emitConverterServiceStoppedEvent : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STOPPED, payload) ;
        });
    } ,


    //----------------- Caught errors throughout the sytem -----------------
    emitError : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.ERROR, payload) ;
        });
    } ,

    emitDataAnomaly : function (payload) {
        process.nextTick(function() {
            eventEmitter.emit(eventEmitter.eventTypes.DATA_ANOMALY, payload) ;
        });
    } ,
} ;




//emitSystemStatus
//emitSystemConfigStatus
//emitLoggingStatus
//emitLoggingConfigStatus
//emitGTFSServiceStatus
//emitGTFSServiceConfigStatus
//emitGTFSDataUpdateStatus
//emitGTFSRealtimeServiceStatus
//emitGTFSRealtimeServiceConfigStatus
//emitConverterServiceStatus
//emitConverterServiceConfigStatus
//emitConverterServiceStartedEvent
//emitConverterServiceStoppedEvent
//emitError
//emitDataAnomaly
