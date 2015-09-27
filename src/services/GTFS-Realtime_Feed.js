'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit
                                                                            .FeedReader,
    ConfigService    = require('./ConfigsService') ,

    feedReaderConfig = ConfigService.getGTFSRealtimeConfig() ,

    feedReader = new GTFSrtFeedReader(feedReaderConfig); 

ConfigService.addGTFSRealtimeConfigUpdateListener(function (config) { feedReader.updateConfig(config); });

module.exports = feedReader;
