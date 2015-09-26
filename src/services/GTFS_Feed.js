'use strict';

var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,

    ConfigService = require('./ConfigsService') ,
    gtfsConfig    = ConfigService.getGTFSConfig() ;

//TODO: The GTFSFeedHandler will need an `updateConfig` method.

module.exports = new GTFSFeedHandler(gtfsConfig);
