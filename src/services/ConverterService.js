'use strict';


var ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,
    gtfsFeed         = require('./GTFS_Feed') ,
    gtfsrtFeed       = require('./GTFS-Realtime_Feed') ,

    ConfigService    = require('./ConfigsService') ,
    converterConfig  = ConfigService.getConverterConfig() ,


    converterStream  = new ConverterStream(gtfsFeed, 
                                           gtfsrtFeed, 
                                           converterConfig, 
                                           null, // trainTrackerInitialState
                                           converterUpdateListener);

var latestConverter = null;

ConfigService.removeTrainTrackerInitialStateFromConverterConfig();

ConfigService.addConverterConfigUpdateListener(converterStream.updateConfig);


// Callback passed to MTA_Subway_GTFS-Realtime_to_SIRI.ConverterStream
function converterUpdateListener (converterUpdate) {
    if (converterUpdate) {
        latestConverter = converterUpdate;
    }
}


function getStopMonitoringResponse (query, extension, callback) {
    latestConverter.getStopMonitoringResponse(query, extension, callback);
}

function getVehicleMonitoringResponse (query, extension, callback) {
    latestConverter.getVehicleMonitoringResponse(query, extension, callback);
}


function getCurrentGTFSRealtimeTimestamp () {
    return latestConverter.getCurrentGTFSRealtimeTimestamp();
}

function getState () {
    return latestConverter.getState() ;
}


converterStream.start();

module.exports = {
    getStopMonitoringResponse       : getStopMonitoringResponse ,
    getVehicleMonitoringResponse    : getVehicleMonitoringResponse ,
    getCurrentGTFSRealtimeTimestamp : getCurrentGTFSRealtimeTimestamp ,
    getState                        : getState ,
};
