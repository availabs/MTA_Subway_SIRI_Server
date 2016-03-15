'use strict';



var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,

    SystemStatusService = require('./SystemStatusService') ,

    ConfigsService = require('./ConfigsService') ;



var feedHandler ;



function start () {
    if (feedHandler) { return; }

    var feedHandlerConfig = ConfigsService.getGTFSConfig() ;

    SystemStatusService.resetGTFSFeedHandlerConstructionLog() ;

    feedHandler = new GTFSFeedHandler(feedHandlerConfig) ;

    ConfigsService.addGTFSConfigUpdateListener(feedHandler.updateConfig);
} 


function stop () {
    if (!feedHandler) { return; }

    ConfigsService.removeGTFSConfigUpdateListener(feedHandler.updateConfig);

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
