/*
 * The core of the Analysis code.
 * The MTA_Subway_GTFS-Realtime_to_SIRI_Converter's ConverterStream is passed 
 *    mocks of the GTFS-RealtimeFeed and the SiriServer's ConfigService.
 * Additionally, this Stream requests new data from the MongoDB archive
 *    once all listeners have completed execution, allowing the archive
 *    to stream through the converter at the fastest possible rate.
 */

'use strict';


/**********************************************************
 * MOCK Converter Service
 *********************************************************/

require(__dirname + '/MockEventHandlingService') ;


var process = require('process') ,

    path = require('path') ,

    _ = require('lodash') ;


process.on('exit', function () { console.log("That's all, folks."); });

var last100Timestamps = require('../meta/last100Timestamps')

var ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,

    GTFS_FeedHandlerService = require(path.join(__dirname, '../../../src/services/GTFS_FeedHandlerService')) ,

    MockGTFSrtFeed = require(path.join(__dirname, '/MockGTFS-Realtime_Feed')) ,

    // The MockFeedReader's constructor:
    //   MockFeedReader (_requestedTrain, startTimestamp, endTimestamp) {

    //mockGTFSrtFeed = new MockGTFSrtFeed(null, null, 1457428587) ,
    //mockGTFSrtFeed = new MockGTFSrtFeed(null, null, 1457500000) ,
    //mockGTFSrtFeed = new MockGTFSrtFeed(null, null, 1457431189) ,
    mockGTFSrtFeed = new MockGTFSrtFeed(null, last100Timestamps[last100Timestamps.length - 1], last100Timestamps[50]) ,
    //mockGTFSrtFeed = new MockGTFSrtFeed() ,

    mockConfigService = require(path.join(__dirname, 'MockConfigsService')) ,

    converterConfig  = mockConfigService.getConverterConfig() ,

    gtfsFeedHandler ,

    converterStream  ;

console.log(last100Timestamps[0], last100Timestamps[last100Timestamps.length - 1]);

GTFS_FeedHandlerService.start() ;

gtfsFeedHandler = GTFS_FeedHandlerService.getFeedHandler() ;



var latestConverter = null;


var listeners = [] ;


// Listeners should be functions with the following signature: f(err, gtfsrtJSON, siriJSON, converterCache) 
function registerListener (listener) {
    if (!_.isFunction(listener))  {
        throw new Error('Listeners must be functions.') ;
    }

    listeners.push(listener);
}


function start () {

    mockGTFSrtFeed.start(function (err) {

        if (err) {
            console.error(err);
            process.exit(1);
        }

        mockGTFSrtFeed.getTrainTrackerInitialState(function (err, trainTrackerInitialState) {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            converterStream  = 
                new ConverterStream(gtfsFeedHandler, mockGTFSrtFeed, converterConfig, 
                                    trainTrackerInitialState , converterUpdateListener );

            mockConfigService.removeTrainTrackerInitialStateFromConverterConfig();
            mockConfigService.addConverterConfigUpdateListener(function (config) { 
                converterStream.updateConfig(config); 
            });

            converterStream.start();

            //start the feed messages.
            if (mockGTFSrtFeed.sendNext() === null) {
                console.log('These are no messages in the mock feed.') ;
            }
        });
    });
    
}


// Callback passed to MTA_Subway_GTFS-Realtime_to_SIRI.ConverterStream
function converterUpdateListener (converterUpdate) {
    if (converterUpdate) {
        latestConverter = converterUpdate;
    }

    var gtfsrtJSON = converterUpdate.GTFSrt.GTFSrt_JSON ;

    converterUpdate.getVehicleMonitoringResponse({vehiclemonitoringdetaillevel: 'calls'}, 'json', function(err, resp) {

        var siriObj = JSON.parse(resp) ;

        _.forEach(listeners, function (listener) { 
            listener(null, gtfsrtJSON, siriObj, converterUpdate); 
        }) ;


        // Signal the mock GTFSrt feed to send another message.
        if (mockGTFSrtFeed.sendNext() === null) {
            console.log('All messages sent. (App should terminate.)') ;
        }
    });

}



function getStopMonitoringResponse (query, extension, callback) {
    latestConverter.getStopMonitoringResponse(query, extension, callback);
}

function getVehicleMonitoringResponse (query, extension, callback) {
    latestConverter.getVehicleMonitoringResponse(query, extension, callback);
}

function getCurrentGTFSRealtimeTimestamp () {
    return latestConverter.getCurrentGTFSRealtimeTimestamp();
}

function getState () {
    return latestConverter.getState() ;
}



module.exports = {
    registerListener                : registerListener ,
    start                           : start ,

    getStopMonitoringResponse       : getStopMonitoringResponse ,
    getVehicleMonitoringResponse    : getVehicleMonitoringResponse ,
    getCurrentGTFSRealtimeTimestamp : getCurrentGTFSRealtimeTimestamp ,
    getState                        : getState ,
};
