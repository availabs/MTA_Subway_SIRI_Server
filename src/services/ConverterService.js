'use strict';


var ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,
    gtfsFeed         = require('./GTFS_Feed')                                                ,
    gtfsrtFeed       = require('./GTFS-Realtime_Feed')                                       ,

    ConfigService    = require('./ConfigsService') ,
    converterConfig  = ConfigService.getConverterConfig() ,


    converterStream  = new ConverterStream(gtfsFeed, gtfsrtFeed, converterConfig, updateConverter);



var latestConverter = null;

ConfigService.addConverterConfigUpdateListener(converterStream.updateConfig);


// Callback passed to MTA_Subway_GTFS-Realtime_to_SIRI.ConverterStream
function updateConverter (converterUpdate) {
    if (converterUpdate) {
        latestConverter = converterUpdate;
    }
}


function getStopMonitoringResponse (params, extension, callback) {
    latestConverter.getStopMonitoringResponse(params, extension, callback);
}

function getVehicleMonitoringResponse (params, extension, callback) {
    latestConverter.getVehicleMonitoringResponse(params, extension, callback);
}



function getCurrentGTFSRealtimeTimestamp () {
    return latestConverter.getCurrentGTFSRealtimeTimestamp();
}


converterStream.start();

module.exports = {
    getStopMonitoringResponse       : getStopMonitoringResponse       ,
    getVehicleMonitoringResponse    : getVehicleMonitoringResponse    ,
    getCurrentGTFSRealtimeTimestamp : getCurrentGTFSRealtimeTimestamp ,
};
