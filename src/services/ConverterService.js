'use strict';


var process = require('process'),
    
    ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,

    eventCreator = require('../events/ServerEventCreator') ,

    GTFS_FeedHandlerService        = require('../services/GTFS_FeedHandlerService') ,
    GTFSRealtime_FeedReaderService = require('../services/GTFSRealtime_FeedReaderService') ,


    ConfigService = require('./ConfigsService') ,

    converterStream ,
    converterStreamConfigUpdateListener;


    
var latestConverter = null;



function isRunning () { return !!converterStream; }


function start (callback) {

    eventCreator.emitConverterServiceStatus({
        debug: 'ConverterService start called.' ,
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });

    // Idempotent
    if (converterStream) { 

        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterService was already running.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        return callback(null); 
    }

    try {
        var converterConfig = ConfigService.getConverterConfig() ;

        
        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterService starting the GTFS_FeedHandlerService.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        GTFS_FeedHandlerService.start() ;

        eventCreator.emitConverterServiceStatus({
            debug: 'GTFS_FeedHandlerService.start returned control to ConverterService.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterService starting the GTFSRealtime_FeedReaderService.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        GTFSRealtime_FeedReaderService.start() ;

        eventCreator.emitConverterServiceStatus({
            debug: 'GTFSRealtime_FeedReaderService.start returned control to the ConverterService.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterService calling the ConverterStream constructor.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        if (!converterConfig) {
            throw new Error('The converter is not configured.');
        }

        converterStream = new ConverterStream(GTFS_FeedHandlerService.getFeedHandler() , 
                                              GTFSRealtime_FeedReaderService.getFeedReader() , 
                                              converterConfig , 
                                              null , // trainTrackerInitialState (for debugging/testing)
                                              converterUpdateListener);

        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterStream constructor returned control to the ConverterService.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        ConfigService.removeTrainTrackerInitialStateFromConverterConfig();

        // Need to preserve the context.
        converterStreamConfigUpdateListener = converterStream.updateConfig.bind(converterStream);

        ConfigService.addConverterConfigUpdateListener(converterStreamConfigUpdateListener);


        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterService calling converterStream.start.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        converterStream.start();

        eventCreator.emitConverterServiceStatus({
            debug: 'converterStream.start returned control to the ConverterService.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        eventCreator.emitConverterServiceStartedEvent({
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        eventCreator.emitConverterServiceStatus({
            info: 'ConverterStream startup process complete.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        return callback && callback(null) ;

    } catch (err) {

        eventCreator.emitConverterServiceStatus({
            error: 'ConverterStream startup process encountered the following error: ' + 
                   err.message + 
                   ' GTFS-Realtime to Siri conversion will not be available' +
                   ' until the configuration problems are fixed.',
            debug: (err.stack || err) ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        if (GTFSRealtime_FeedReaderService) {
            GTFS_FeedHandlerService.stop() ;
        }

        if (GTFSRealtime_FeedReaderService) {
            GTFSRealtime_FeedReaderService.stop() ;
        }

        if (converterStream) {
            converterStream.stop();
        }

        return callback && callback(err); 
    }
}


function stop (callback) {

    eventCreator.emitConverterServiceStatus({
        debug: 'ConverterService stop called.' ,
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });

    // Idempotent
    if (!converterStream) { 

        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterStream was already stopped.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        return callback(null); }

    try {

        eventCreator.emitConverterServiceStatus({
            debug: 'ConverterService shutdown process started.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
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


        eventCreator.emitConverterServiceStoppedEvent({
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        eventCreator.emitConverterServiceStatus({
            info: 'ConverterStream shutdown process complete.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        return callback && callback(null) ;

    } catch (err) {
        eventCreator.emitConverterServiceStatus({
            error: 'ConverterStream shutdown process encountered an error.' ,
            debug: (err.stack || err) ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
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
