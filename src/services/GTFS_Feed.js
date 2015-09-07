'use strict';

var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,
    gtfsConfig      = require('../../config/GTFS_config') ;

module.exports = new GTFSFeedHandler(gtfsConfig);
