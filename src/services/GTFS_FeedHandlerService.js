'use strict';



var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,

    SystemStatusService = require('./SystemStatusService') ,

    ConfigsService = require('./ConfigsService') ;



var feedHandler ,
    configUpdateListener; 



function start () {
    if (feedHandler) { return; }

    var feedHandlerConfig = ConfigsService.getGTFSConfig() ;

    if (!feedHandlerConfig.feedURL) {
        throw new Error('The GTFS feed is not configured.');
    }

    SystemStatusService.resetGTFSFeedHandlerConstructionLog() ;

    feedHandler = new GTFSFeedHandler(feedHandlerConfig) ;

    configUpdateListener = feedHandler.updateConfig.bind(feedHandler);
    // Need to preserve the context of the feedHandler's updateConfig call.
    ConfigsService.addGTFSConfigUpdateListener(configUpdateListener);
} 


function stop () {
    if (!feedHandler) { return; }

    ConfigsService.removeGTFSConfigUpdateListener(configUpdateListener);

    configUpdateListener = null;
    feedHandler = null ;
}


function restart () {
    if (feedHandler) { stop() ; }

    start() ;
}


function updateFeedHandler(src, gtfsDataUpdateCallback) {
    feedHandler.update(src, gtfsDataUpdateCallback) ;
}


function getFeedHandler () {
    return feedHandler ;
}


module.exports = {
    start   : start ,
    stop    : stop ,
    restart : restart ,

    updateFeedHandler : updateFeedHandler ,

    getFeedHandler : getFeedHandler ,
} ;
