'use strict';



var GTFSFeedHandler = require ('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.FeedHandler ,

    ConfigsService = require('./ConfigsService') ,

    eventCreator = require('../events/ServerEventCreator');



var feedHandler ,
    configUpdateListener; 


function start () {
    if (feedHandler) { return; }

    var feedHandlerConfig = ConfigsService.getGTFSConfig() ;

    if (!feedHandlerConfig.gtfsConfigFilePath) {
        throw new Error('The GTFS feed is not configured.');
    }

    try {
        feedHandler = new GTFSFeedHandler(feedHandlerConfig) ;
    } catch (err) {

        feedHandler = null;

        console.error('Could not construct the GTFS Feed Handler.');
        throw err;
    }

    // Need to preserve the context of the feedHandler's updateConfig call.
    configUpdateListener = feedHandler.updateConfig.bind(feedHandler);

    ConfigsService.addGTFSConfigUpdateListener(configUpdateListener);

    eventCreator.emitGTFSServiceStatus({
        info: 'GTFS FeedHandler started.',
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });
} 


function stop () {
    if (!feedHandler) { return; }

    ConfigsService.removeGTFSConfigUpdateListener(configUpdateListener);

    configUpdateListener = null;
    feedHandler = null ;

    eventCreator.emitGTFSServiceStatus({
        info: 'GTFS FeedHandler stopped.',
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });
}


function restart () {
    if (feedHandler) { stop() ; }

    start() ;
}


function updateFeedHandler(src, gtfsDataUpdateCallback) {
    var feedHandlerRunning = !!feedHandler;

    if (!feedHandlerRunning) {
        try {
            start();
        } catch (err) {
            return gtfsDataUpdateCallback(err);
        }
    }

    feedHandler.update(src, function (err, data) {
        if (!feedHandlerRunning) {
            stop();
        }
        return gtfsDataUpdateCallback(err, data);
    }) ;
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
