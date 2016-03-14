'use strict';


var EventEmitter = require('events') ,
    util = require('util') ;



function ServerEventEmitter () {
    EventEmitter.call(this) ;
}

util.inherits(ServerEventEmitter, EventEmitter) ;


ServerEventEmitter.prototype.eventTypes = {
    GTFS_FEED_UPDATE_STATUS          : 'GTFS_FEED_UPDATE_STATUS' ,
    GTFS_REALTIME_FEED_UPDATE_STATUS : 'GTFS_REALTIME_FEED_UPDATE_STATUS' ,
    CONVERTER_CONFIG_UPDATE_STATUS   : 'CONVERTER_CONFIG_UPDATE_STATUS' ,
};



module.exports = new ServerEventEmitter() ;
