'use strict';




/**********************************************************
 * MOCK Converter Service
 *********************************************************/

var process = require('process') ;

var ConverterStream  = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').ConverterStream ,
    gtfsFeed         = require('../../src/services/GTFS_Feed') ,

    MockGTFSrtFeed   = require('./MockGTFS-Realtime_Feed') ,

    //mockGTFSrtFeed   = new MockGTFSrtFeed('006700_3..N42R', 1457245526, 1457245803) ,
    mockGTFSrtFeed   = new MockGTFSrtFeed() ,
    //mockGTFSrtFeed   = new MockGTFSrtFeed('013400_4..S13R', 1457248400) ,
    //mockGTFSrtFeed   = new MockGTFSrtFeed('040700_3..N42R', 1457263029) ,

    mockConfigService = require('./MockConfigsService') ,

    converterConfig  = mockConfigService.getConverterConfig() ,

    converterStream  ;



var latestConverter = null;



(function start () {

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
                new ConverterStream(gtfsFeed, mockGTFSrtFeed, converterConfig, 
                                    trainTrackerInitialState , converterUpdateListener );

            mockConfigService.removeTrainTrackerInitialStateFromConverterConfig();
            mockConfigService.addConverterConfigUpdateListener(converterStream.updateConfig);

            converterStream.start();

            //start the feed messages.
            if (mockGTFSrtFeed.sendNext() === null) {
                console.log('All messages sent. (App should terminate.)') ;
            }
        });
    });
    
}());


// Callback passed to MTA_Subway_GTFS-Realtime_to_SIRI.ConverterStream
function converterUpdateListener (converterUpdate) {
    if (converterUpdate) {
        latestConverter = converterUpdate;
    }

    if (mockGTFSrtFeed.sendNext() === null) {
        console.log('All messages sent. (App should terminate.)') ;
    } 
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
    getStopMonitoringResponse       : getStopMonitoringResponse ,
    getVehicleMonitoringResponse    : getVehicleMonitoringResponse ,
    getCurrentGTFSRealtimeTimestamp : getCurrentGTFSRealtimeTimestamp ,
    getState                        : getState ,
};
