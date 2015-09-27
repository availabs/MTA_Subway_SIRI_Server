'use strict';

var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,

    ConfigService = require('./ConfigsService') ,
    gtfsConfig    = ConfigService.getGTFSConfig() ,

    feedHandler = new GTFSFeedHandler(gtfsConfig); 

ConfigService.addGTFSConfigUpdateListener(feedHandler.updateConfig);


module.exports = feedHandler;
