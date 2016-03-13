'use strict';

var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,

    ConfigService = require('../services/ConfigsService') ,
    gtfsConfig    = ConfigService.getGTFSConfig() ,

    eventHandlingService = require('../services/EventHandlingService') ,

    feedHandler = new GTFSFeedHandler(gtfsConfig), 

    gtfsToolkitEventEmitter = feedHandler.toolkitEventEmitter ;



ConfigService.addGTFSConfigUpdateListener(feedHandler.updateConfig);


eventHandlingService.registerGTFSToolkitEventListeners(gtfsToolkitEventEmitter) ;


module.exports = feedHandler;
