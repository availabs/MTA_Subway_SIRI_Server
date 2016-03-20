'use strict';


var eventEmitter = require('./ServerEventEmitter.js') ;


module.exports = {

    emitStartupLoggingConfigStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.STARTUP_LOGGING_CONFIG_STATUS, payload) ;
    } ,

    emitStartupServerConfigStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.STARTUP_SERVER_CONFIG_STATUS, payload) ;
    } ,

    emitStartupActiveFeedConfigStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.STARTUP_ACTIVE_FEED_CONFIG_STATUS, payload) ;
    } ,

    emitGTFSFeedUpdateStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.GTFS_FEED_UPDATE_STATUS, payload) ;
    } ,

    emitGTFSRealtimeFeedUpdateStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.GTFS_REALTIME_FEED_UPDATE_STATUS, payload) ;
    } ,

    emitConverterServiceStartedEvent : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STARTED, payload) ;
    } ,

    emitConverterServiceStoppedEvent : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STOPPED, payload) ;
    } ,

    emitConverterServiceStatusUpdate : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STATUS, payload) ;
    } ,

    emitConverterConfigUpdateStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_CONFIG_UPDATE_STATUS, payload) ;
    } ,

    emitError : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.ERROR, payload) ;
    } ,

} ;

