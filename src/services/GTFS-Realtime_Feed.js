'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit
                                                                            .FeedReader,
    feedReaderConfig = require('../../config/GTFS-Realtime_FeedReader_config');


module.exports = new GTFSrtFeedReader(feedReaderConfig);
