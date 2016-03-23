'use strict';


var ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,

    ServerEventCreator = require('../events/ServerEventCreator') ,

    GTFS_FeedHandlerService        = require('../services/GTFS_FeedHandlerService') ,
    GTFSRealtime_FeedReaderService = require('../services/GTFSRealtime_FeedReaderService') ,


    ConfigService = require('./ConfigsService') ,

    converterStream ,
    converterStreamConfigUpdateListener;


    
var latestConverter = null;



function isRunning () { return !!converterStream; }


function start (callback) {

    ServerEventCreator.emitConverterServiceStatusUpdate({
        info: 'ConverterService start called.' ,
        timestamp: Date.now() ,
    });

    // Idempotent
    if (converterStream) { 

        ServerEventCreator.emitConverterServiceStatusUpdate({
            info: 'ConverterService was already running.' ,
            timestamp: Date.now() ,
        });

        return callback(null); 
    }

    try {
        var converterConfig = ConfigService.getConverterConfig() ;

        
        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'ConverterService starting the GTFS_FeedHandlerService.' ,
            timestamp: Date.now() ,
        });

        GTFS_FeedHandlerService.start() ;

        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'GTFS_FeedHandlerService.start returned control to ConverterService.' ,
            timestamp: Date.now() ,
        });


        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'ConverterService starting the GTFSRealtime_FeedReaderService.' ,
            timestamp: Date.now() ,
        });

        GTFSRealtime_FeedReaderService.start() ;

        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'GTFSRealtime_FeedReaderService.start returned control to the ConverterService.' ,
            timestamp: Date.now() ,
        });


        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'ConverterService calling the ConverterStream constructor.' ,
            timestamp: Date.now() ,
        });


        if (!converterConfig) {
            throw new Error('The converter is not configured.');
        }

        converterStream = new ConverterStream(GTFS_FeedHandlerService.getFeedHandler() , 
                                              GTFSRealtime_FeedReaderService.getFeedReader() , 
                                              converterConfig , 
                                              null , // trainTrackerInitialState (for debugging/testing)
                                              converterUpdateListener);

        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'ConverterStream constructor returned control to the ConverterService.' ,
            timestamp: Date.now() ,
        });


        ConfigService.removeTrainTrackerInitialStateFromConverterConfig();

        // Need to preserve the context.
        converterStreamConfigUpdateListener = converterStream.updateConfig.bind(converterStream);

        ConfigService.addConverterConfigUpdateListener(converterStreamConfigUpdateListener);


        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'ConverterService calling converterStream.start.' ,
            timestamp: Date.now() ,
        });

        converterStream.start();

        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'converterStream.start returned control to the ConverterService.' ,
            timestamp: Date.now() ,
        });

        ServerEventCreator.emitConverterServiceStartedEvent({
            timestamp: Date.now() ,
        });

        ServerEventCreator.emitConverterServiceStatusUpdate({
            info: 'ConverterStream startup process complete.' ,
            timestamp: Date.now() ,
        });


        return callback && callback(null) ;

    } catch (err) {

        ServerEventCreator.emitConverterServiceStatusUpdate({
            error: 'ConverterStream startup process encountered an error.' ,
            debug: (err.stack || err) ,
            timestamp: Date.now() ,
        });

        return callback && callback(err); 
    }
}


function stop (callback) {

    ServerEventCreator.emitConverterServiceStatusUpdate({
        info: 'ConverterService stop called.' ,
        timestamp: Date.now() ,
    });

    // Idempotent
    if (!converterStream) { 

        ServerEventCreator.emitConverterServiceStatusUpdate({
            info: 'ConverterStream was already stopped.' ,
            timestamp: Date.now() ,
        });

        return callback(null); }

    try {

        ServerEventCreator.emitConverterServiceStatusUpdate({
            debug: 'ConverterService shutdown process started.' ,
            timestamp: Date.now() ,
        });

        // Deregisters listeners from the GTFS FeedHandler and the GTFS-Realtime FeedReader.
        converterStream.stop();

        GTFS_FeedHandlerService.stop() ;

        GTFSRealtime_FeedReaderService.stop() ;

        //converterStream does not require destruction.

        ConfigService.removeConverterConfigUpdateListener(converterStreamConfigUpdateListener);

        converterStreamConfigUpdateListener = null;

        latestConverter = null ;

        converterStream = null ;


        ServerEventCreator.emitConverterServiceStoppedEvent({
            timestamp: Date.now() ,
        });

        ServerEventCreator.emitConverterServiceStatusUpdate({
            info: 'ConverterStream shutdown process complete.' ,
            timestamp: Date.now() ,
        });


        return callback && callback(null) ;

    } catch (err) {
        ServerEventCreator.emitConverterServiceStatusUpdate({
            error: 'ConverterStream shutdown process encountered an error.' ,
            debug: (err.stack || err) ,
            timestamp: Date.now() ,
        });

        return callback && callback(err); 
    }
}



// Callback passed to MTA_Subway_GTFS-Realtime_to_SIRI.ConverterStream
function converterUpdateListener (converterUpdate) {
    if (converterUpdate) {
        latestConverter = converterUpdate;
    }
}


function getStopMonitoringResponse (query, extension, callback) {
    if (!converterStream) {
        throw new Error('The Converter is not running.') ;
    }
    latestConverter.getStopMonitoringResponse(query, extension, callback);
}

function getVehicleMonitoringResponse (query, extension, callback) {
    if (!converterStream) {
        throw new Error('The Converter is not running.') ;
    }
    latestConverter.getVehicleMonitoringResponse(query, extension, callback);
}


function getCurrentGTFSRealtimeTimestamp () {
    if (!converterStream) {
        throw new Error('The Converter is not running.') ;
    }
    return latestConverter.getCurrentGTFSRealtimeTimestamp();
}

function getState () {
    if (!converterStream) {
        throw new Error('The Converter is not running.') ;
    }
    return latestConverter.getState() ;
}


//TODO: Autostart config flag 
start();

module.exports = {
    start                           : start ,
    stop                            : stop ,
    isRunning                       : isRunning ,
    getStopMonitoringResponse       : getStopMonitoringResponse ,
    getVehicleMonitoringResponse    : getVehicleMonitoringResponse ,
    getCurrentGTFSRealtimeTimestamp : getCurrentGTFSRealtimeTimestamp ,
    getState                        : getState ,
};
