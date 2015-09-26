'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit
                                                                            .FeedReader,
    ConfigService    = require('./ConfigsService') ,
    feedReaderConfig = ConfigService.getGTFSRealtimeConfig() ;


//TODO: The GTFSrtFeedHandler will need an `updateConfig` method.
module.exports = new GTFSrtFeedReader(feedReaderConfig);
