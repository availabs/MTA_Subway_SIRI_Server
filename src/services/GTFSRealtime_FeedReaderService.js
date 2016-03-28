'use strict';

var GTFSrtFeedReader = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Realtime_Toolkit
                                                                            .FeedReader,
    ConfigsService = require('../services/ConfigsService') ,

    eventCreator = require('../events/ServerEventCreator') ;



var feedReader ,
    configUpdateListener;



function start () {
    if (feedReader) { return; }

    var feedReaderConfig = ConfigsService.getGTFSRealtimeConfig() ;

    if (!feedReaderConfig.feedURL) {
        throw new Error('No GTFS-Realtime configuration.');
    }

    if (!feedReader) {
        feedReader = new GTFSrtFeedReader(feedReaderConfig) ;

        // Need to preserve the context.
        configUpdateListener = feedReader.updateConfig.bind(feedReader);

        ConfigsService.addGTFSRealtimeConfigUpdateListener(configUpdateListener); 
    }

    // We need one feedReader. Starting and stopping it suffices.
    //feedReader = feedReader || new GTFSrtFeedReader(feedReaderConfig) ;

    // Need to preserve the context.
    //configUpdateListener = feedReader.updateConfig.bind(feedReader);

    //ConfigsService.addGTFSRealtimeConfigUpdateListener(configUpdateListener); 

    eventCreator.emitGTFSRealtimeServiceStatus({
        info: 'GTFS-Realtime Feed Reader started.',
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });
} 


function stop () {
    if (!feedReader) { return; }

    //ConfigsService.removeGTFSRealtimeConfigUpdateListener(configUpdateListener);

    //configUpdateListener = null;

    // The ConverterStream's removing itself as a listener suffices.
    //feedReader.stop();
    //feedReader = null ;

    eventCreator.emitGTFSRealtimeServiceStatus({
        info: 'GTFS-Realtime Feed Reader stopped.',
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });
}


function restart () {
    if (feedReader) { stop() ; }

    start() ;
    //feedReader.restart();
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
