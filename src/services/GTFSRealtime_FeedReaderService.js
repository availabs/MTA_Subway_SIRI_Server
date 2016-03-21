'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit
                                                                            .FeedReader,
    ConfigsService = require('../services/ConfigsService') ;



var feedReader;



function start () {
    if (feedReader) { return; }

    var feedReaderConfig = ConfigsService.getGTFSRealtimeConfig() ;


    feedReader = new GTFSrtFeedReader(feedReaderConfig) ;

    if (!feedReader.feedURL) {
        throw new Error('No GTFS-Realtime configuration.');
    }

    ConfigsService.addGTFSRealtimeConfigUpdateListener(feedReader.updateConfig); 
} 


function stop () {
    if (!feedReader) { return; }

    ConfigsService.removeGTFSRealtimeConfigUpdateListener(feedReader.updateConfig);

    feedReader = null ;
}


function restart () {
    if (feedReader) { stop() ; }

    start() ;
}


function getFeedReaderState () {
    return feedReader && feedReader.getState() ;    
}

function getFeedReader () {
    return feedReader;
}


module.exports = {
    start              : start ,
    stop               : stop ,
    restart            : restart ,

    getFeedReaderState : getFeedReaderState ,

    getFeedReader      : getFeedReader ,
} ;
