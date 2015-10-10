'use strict';


var ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,
    gtfsFeed         = require('./GTFS_Feed')                                                ,
    gtfsrtFeed       = require('./GTFS-Realtime_Feed')                                       ,

    ConfigService    = require('./ConfigsService') ,
    converterConfig  = ConfigService.getConverterConfig() ,

    converterStream  = new ConverterStream(gtfsFeed, gtfsrtFeed, converterConfig, updateConverter);


//TODO: Converter stream needs an updateconfig method.

var latestConverter = null;

ConfigService.addConverterConfigUpdateListener(converterStream.updateConfig);


// Callback passed to MTA_Subway_GTFS-Realtime_to_SIRI.ConverterStream
function updateConverter (converterUpdate) {
    latestConverter = converterUpdate;
}

function getStopMonitoringResponse (params) {
    var smr = latestConverter.getStopMonitoringResponse(params);

    smr.timestamper.stamp();
    return smr.response;
}


function getVehicleMonitoringResponse (params) {
    var smr = latestConverter.getVehicleMonitoringResponse(params);

    smr.timestamper.stamp(); //FIXME
    return smr.response;
}


converterStream.start();

module.exports = {
    getStopMonitoringResponse    : getStopMonitoringResponse    ,
    getVehicleMonitoringResponse : getVehicleMonitoringResponse ,
};
