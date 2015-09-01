'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit.FeedReader,
    ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream,
    feedReaderConfig = require('../../config/GTFS-Realtime_FeedReader_config'),
    gtfsConfig       = require('../../config/GTFS_config');


var feedReader = new GTFSrtFeedReader(feedReaderConfig),
    stream     = new ConverterStream(feedReader, gtfsConfig.gtfsDataDir, updateConverter);

var latestConverter = null;

function updateConverter (newConverter) {
    latestConverter = newConverter;
}

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


stream.start();

module.exports = {
    getStopMonitoringResponse    : getStopMonitoringResponse    ,
    getVehicleMonitoringResponse : getVehicleMonitoringResponse ,
};
