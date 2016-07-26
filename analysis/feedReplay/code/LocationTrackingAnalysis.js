'use strict' ;

//var util = require('util') ;

var process = require('process') ,
    _    = require('lodash') ,
    ss   = require('simple-statistics') ;



var prevCoordsMap = {} ,

    trackingAll = false,

    tripsWithCoordsLog = [] ,
    trackingAllIndex = -1 ,

    timestampToMessageNumber = {} ,
    messageCounter = 0 ,

    trainHadLocationCount = 0,
    lostTrainCount = 0 ,

    // Trains without locations, after the trackingAll flag set to true.
    stealthTrains = {} ,

    //stealthTrainKeys ,

    // { tripKey: [[locationInfo],...]
    tripTrackingMap = {} ,

    carryOverTrainsMap = {} ;



function analyzeTripsWithCoords () {
    
    if (trackingAllIndex < 0) {
        return null ;
    }

    var toFractions = tripsWithCoordsLog.slice(trackingAllIndex)
                                        .map(function (pair) { return (pair[0] / pair[1] * 100); });

    return {
        description: 'Provides summary statistics regarding the percentage of trips with ' +
                     'locations in the Siri feed to all trip occurrences. ' +
                     'Starts keeping stats once tracking has begun for all trips ' + 
                     'that have the requisite GTFS data. ' + 
                     '"messagesBeforeTrackingAll" is the number of messages before this condition was met.',

        messagesBeforeTrackingAll: trackingAllIndex ,
       
        mad : ss.mad(toFractions) ,

        mean: ss.mean(toFractions) ,

        variance : ss.variance(toFractions) ,

        standardDeviation: ss.standardDeviation(toFractions) ,
    
        min: ss.min(toFractions) ,
    };
}


function analyzeLostTrainOccurrences () {
    return {
        description: 'Describes the number of times we assigned a train a location, ' +
                     ' to then in a following message have no location. Ideally zero. ' +
                     '"totalLostAcrossMessages" represents the number of lost train occurrences. ' +
                     '"totalAcrossMessagesTrackings" represents the total number of times ' +
                     'a train was tracked across two GTFS-realtime messages.',

        totalLostAcrossMessages: lostTrainCount,
        totalAcrossMessagesTrackings: trainHadLocationCount ,
    } ;
}



function analyzeTripAppearances () {
    var messageCountGapsBetweenAppearances = _.reduce(tripTrackingMap, function (acc, locArrArr, key) {

        var firstOccurrence = _.first(_.first(locArrArr)) ,
            lastOccurrence  = _.last(_.last(locArrArr)) ;
        

        var locArrArrFiltered = locArrArr.filter(function (locArr) { return locArr.length; }),

            startEndLocArrPairs = locArrArrFiltered.map(function (locArr) {
                var firstTimestamp = _.first(locArr).timestamp,
                    firstMsgNum    = timestampToMessageNumber[firstTimestamp], 
                    firstStopId    = _.first(locArr).stopId ,

                    lastTimestamp  = _.last(locArr).timestamp ,
                    lastMsgNum     = timestampToMessageNumber[lastTimestamp] ,
                    lastStopId     = _.last(locArr).stopId ;
                

                if ((firstMsgNum === null) && (lastMsgNum === null)) { 
                    console.log('*** (firstMsgNum === null) && (lastMsgNum === null) ***');
                    console.log(locArr); 
                    console.log('*******************************************************');
                }

                return { 
                    timestamps:  [firstTimestamp, lastTimestamp] ,
                    msgsMissing: [firstMsgNum, lastMsgNum] , 
                    stopIds: [firstStopId, lastStopId] 
                } ;
            }),

            gaps = _.tail(startEndLocArrPairs).map(function (pair, i) {
                var 
                    gapStart  = parseInt(startEndLocArrPairs[i].msgsMissing[1]) ,
                    tsStart   = startEndLocArrPairs[i].timestamps[1] ,
                    stopStart = startEndLocArrPairs[i].stopIds[1] ,

                    gapEnd   = parseInt(pair.msgsMissing[0]) ,
                    tsStop   = pair.timestamps[0] ,
                    stopEnd  = pair.stopIds[0] ,

                    gapRange = [];

                if (!isNaN(gapStart)) { 
                    gapRange.push({ msgNum: gapStart, stopId: stopStart, timestampStart: tsStart, }); 
                }
                if (!isNaN(gapEnd)) { gapRange.push({ msgNum: gapEnd, stopId: stopEnd, timestampStop: tsStop }); }

                //if ( (gapRange.length === 2) && 
                     //(gapRange[0].msgNum === gapRange[1].msgNum) && 
                     //(gapRange[0].stopId === gapRange[1].stopId) ) {

                        //gapRange.length = 1;
                //}

                return gapRange ;
            }).filter(function (gap) { return gap && gap.length; });


        if (gaps && gaps.length) {
            acc[key] = { 
                gaps: gaps, 
                firstOccurrence: firstOccurrence, 
                lastOccurrence: lastOccurrence,
                timeInSystem: lastOccurrence.timestamp - firstOccurrence.timestamp ,
                distTraveled: lastOccurrence.distTraveled ,
            } ;
        }

        return acc;
    }, {});


    var byAppearanceCount = _.reduce(messageCountGapsBetweenAppearances, function (acc, gapPairArr, key) {
        (acc[gapPairArr.gaps.length] || (acc[gapPairArr.gaps.length] = [])).push(key);

        return acc;
    }, {}) ;


    return {
        tripKeyToGapsStartEndPairs : messageCountGapsBetweenAppearances ,
        byAppearanceCount          : byAppearanceCount ,
    } ;
}




function analyzeDistancesTraveled () {

    var allSpeeds = [];

    var tripKeyToSpeedsArr =  _.reduce(tripTrackingMap, function (acc, locArrArr, key) {


            var locArr = _.flatten(locArrArr) ,

                locArrFiltered = locArr.filter(function (locObj) { 
                    return (locObj && locObj.timestamp && !isNaN(parseInt(locObj.distTraveled)));
                }) ,

                distTimestampPairs = locArrFiltered.map(function (locObj) {
                    return { d:locObj.distTraveled, t: locObj.timestamp } ;
                }),

                speeds = _.tail(distTimestampPairs).map(function (pair, i) {

                    var dX = (pair.d - distTimestampPairs[i].d) ,
                        dT = (pair.t - distTimestampPairs[i].t) ,

                        kmPerSec =  dX / dT ,

                        // km/s * m/km * s/h = m/h
                        mph = kmPerSec * 0.62137 * (60 * 60) ;

                    // for the speed summary stats, we filter out the cases where the train is stopped, 
                    // of was stopped at the previous stop, or will be stopped at the next stop.
                    if ((distTimestampPairs[i+1] && distTimestampPairs[i] && distTimestampPairs[i-1]) && 
                        (distTimestampPairs[i+1].d - distTimestampPairs[i].d) &&
                        (distTimestampPairs[i].d - distTimestampPairs[i-1].d)) {

                          allSpeeds.push(mph); 
                    }

                    return { pair: pair, dX: dX, dT: dT, mph: mph } ;
                }) ,
                
                trimDwellAtOrigin = speeds.reduce(function (acc2, speed) {
                    if (speed.mph || acc2.length) { acc2.push(speed); }

                    return acc2;
                }, []);

            if (trimDwellAtOrigin.length) { acc[key] = trimDwellAtOrigin; }

            return acc ;
    }, {});

    var speedStats = {
        mean: ss.mean(allSpeeds) ,
        variance : ss.variance(allSpeeds) ,
        standardDeviation : ss.standardDeviation(allSpeeds) ,
        max: ss.max(allSpeeds) ,
    };

    return {
        tripSpeeds : tripKeyToSpeedsArr ,
        speedStats : speedStats , 
    } ;
}


function feedListener (err, gtfsrtJSON, siriJSON, converterCache) {
    //========== Get the data to be reused by all analyzers =========
    if (err) {
      return console.err(err.stack || err);
    }

    // 
    var trainTrackerSnapshot = converterCache.converter.trainTrackerSnapshot ,
        __unscheduled        = trainTrackerSnapshot.trainLocations.__unscheduledTrips ,
        __noSpatialData      = trainTrackerSnapshot.trainLocations.__noSpatialDataTrips ,

        gtfsrtTimestamp = gtfsrtJSON.header.timestamp.low ,

        unschedMap = __unscheduled.reduce(function (acc, trip) { 
                        acc[trip.split('_').slice(-2).join('_')] = 1; return acc; 
                     }, {}) ,
        noDataMap  = __noSpatialData.reduce(function (acc, trip) { 
                        acc[trip.split('_').slice(-2).join('_')] = 1; return acc; 
                    }, {}) ,

        vehicleActivity = siriJSON.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity,

        // 
        trackedTrainGTFSrtKeys = [],

        gtfsrtKeyToGTFSKey = {} ,

        coordsMap = {} ;


    timestampToMessageNumber[gtfsrtTimestamp] = ++messageCounter ;


    _.forEach(vehicleActivity, function (vehAct) { 
        var siriKey = vehAct.MonitoredVehicleJourney
                            .FramedVehicleJourneyRef
                            .DatedVehicleJourneyRef ,

            gtfsKey   = siriKey.substring(18) ,
            gtfsrtKey = siriKey.split('_').slice(-2).join('_') ;


        // If the train doesn't have the minimum amount of associated GTFS
        // data required for tracking, skip it.
        if (unschedMap[gtfsrtKey] || noDataMap[gtfsrtKey]) { return; }
        
        // This gtfsrtKey has the min amt of GTFS data, so it should be tracked.
        trackedTrainGTFSrtKeys.push(gtfsrtKey) ;

        gtfsrtKeyToGTFSKey[gtfsrtKey] = gtfsKey ;

        coordsMap[gtfsrtKey] = vehAct.MonitoredVehicleJourney.VehicleLocation ;
    }) ;


    if (trackingAll) { 
      _.forEach(trackedTrainGTFSrtKeys, function (key) {
          if (!coordsMap[key].Longitude) {
              if (!stealthTrains[key]) {
                  stealthTrains[key] = gtfsrtTimestamp;
              }
          }
      });
    }

    (function () {
        var tripsCount = 0,
            withCoordsCounter = 0 ;

        _.forEach(trackedTrainGTFSrtKeys, function (key) {
            
            ++tripsCount ;

            if (coordsMap[key].Longitude) { ++withCoordsCounter ; }    
        });

        trackingAll = trackingAll || (tripsCount === withCoordsCounter);

        if ((trackingAllIndex < 0) && (withCoordsCounter === tripsCount)) {
            trackingAllIndex =  tripsWithCoordsLog.length;
        }

        tripsWithCoordsLog.push([withCoordsCounter, tripsCount]) ;
    }());


    //====================================================================
    // Get the ratio of instances where a train had a location, but then was lost,
    // to all transitions across messages, for all trains.

    (function () {
        _.forEach(trackedTrainGTFSrtKeys, function (key) {

            if (prevCoordsMap[key] && prevCoordsMap[key].Longitude) {
               ++trainHadLocationCount; 

                if (!coordsMap[key].Longitude) {
                    ++lostTrainCount ;
                }    
            }
        }) ;
    }());


    //====================================================================
    // Collect all the distances traveled between messages for all trains.

    (function () {
        _.forEach(trackedTrainGTFSrtKeys, function (key) {

            if (!tripTrackingMap[key]) {
                tripTrackingMap[key] = [];
            }

            if (!coordsMap[key].Longitude) {
                return;
            }    

            var gtfsKey = gtfsrtKeyToGTFSKey[key] ,

                trainLocationEntry = converterCache.converter.trainTrackerSnapshot.trainLocations[gtfsKey] ,

                stopInfo,

                nodeData;

            if (!trainLocationEntry) { return ;}

            stopInfo = trainLocationEntry.immediateStopInfo ;

                 //['trainLocations', gtfsTripKey, 'locationGeoJSON', 'properties', 'start_dist_along_route_in_km'], 
            nodeData = {
                nextStopId   : stopInfo.stopId ,
                distTraveled : trainLocationEntry.locationGeoJSON.properties.start_dist_along_route_in_km ,
                timestamp    : stopInfo.timestamp ,
                eta          : stopInfo.eta ,
                atStop       : stopInfo.atStop ,
            } ;

            if (prevCoordsMap[key] && prevCoordsMap[key].Longitude) {
                _.last(tripTrackingMap[key]).push(nodeData);
            } else {
                tripTrackingMap[key].push([nodeData]) ;
            }
        }) ;
    }());

    carryOverTrainsMap = trackedTrainGTFSrtKeys.reduce(function(acc, key) { acc[key] = 1; return acc; }, {}) ;

    prevCoordsMap = coordsMap ;

}


module.exports = feedListener ;


// NOTE: Uses process' exit event to trigger analysis.
// TODO: Find a better way of doing this.
process.on('exit', function () {
    
    var analysis = {
            assigningCoordinates : analyzeTripsWithCoords() ,
            lostTrains           : analyzeLostTrainOccurrences() ,
            appearances          : analyzeTripAppearances() ,
            stealthTrains        : stealthTrains ,
            speeds               : analyzeDistancesTraveled() ,
        } ;

    require('fs').writeFileSync('LocationTrackingAnalysisResults.json', JSON.stringify(analysis, null, 4));
});
