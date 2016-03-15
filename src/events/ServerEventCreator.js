'use strict';


var eventEmitter = require('./ServerEventEmitter.js') ;


module.exports = {

    emitError : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.ERROR, payload) ;
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
        eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_SERVICE_STATUS_UPDATE, payload) ;
    } ,

    emitConverterConfigUpdateStatus : function (payload) {
        eventEmitter.emit(eventEmitter.eventTypes.CONVERTER_CONFIG_UPDATE_STATUS, payload) ;
    } ,
} ;

