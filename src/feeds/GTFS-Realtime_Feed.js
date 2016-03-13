'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit
                                                                            .FeedReader,
    ConfigService = require('../services/ConfigsService') ,

    eventHandlingService = require('../services/EventHandlingService') ,

    feedReaderConfig = ConfigService.getGTFSRealtimeConfig() ,

    feedReader = new GTFSrtFeedReader(feedReaderConfig) ,

    gtfsrtToolkitEventEmitter = feedReader.toolkitEventEmitter ;



ConfigService.addGTFSRealtimeConfigUpdateListener(function (config, callback) { 
    feedReader.updateConfig(config, callback); 
});


eventHandlingService.registerGTFSRealtimeToolkitEventListeners(gtfsrtToolkitEventEmitter) ;



module.exports = feedReader;
