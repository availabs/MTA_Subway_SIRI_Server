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
    latestConverter = converterUpdate;
}


//function getStopMonitoringResponse (params, resp, callback) {
    //latestConverter.getStopMonitoringResponse(params, resp, callback);
//}

//function getVehicleMonitoringResponse (params, resp, callback) {
    //latestConverter.getVehicleMonitoringResponse(params, resp, callback);
//}

function getStopMonitoringResponse (params) {
    var smr = latestConverter.getStopMonitoringResponse(params);

    smr.timestamper.stamp();
    return smr.response;
}


function getVehicleMonitoringResponse (params) {
    var smr = latestConverter.getVehicleMonitoringResponse(params);

    smr.timestamper.stamp(); 
    return smr.response;
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
