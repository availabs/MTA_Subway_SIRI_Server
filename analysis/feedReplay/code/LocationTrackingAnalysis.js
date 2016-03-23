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

    // Trains that do not have locations, after the trackingAll flag set to true.
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
                                        .map(function (pair) { return (pair[0] / pair[1]); });

    return {
        messagesBeforeTrackingAll: trackingAllIndex ,
       
        mad : ss.mad(toFractions) ,

        mean: ss.mean(toFractions) ,

        variance : ss.variance(toFractions) ,
        standardDeviation: ss.standardDeviation(toFractions) ,
    
        min: ss.min(toFractions) ,
    };
}


function analyzeLostTrainOccurances () {
    return {
        description: 'Describes the number of times we assigned a train a location, ' +
                     ' to then in a following message have no location. Ideally zero.',

        totalLostAcrossMessages: lostTrainCount,
        totalAcrossMessagesTrackings: trainHadLocationCount ,
    } ;
}



function analyzeTripAppearances () {
    var messageCountGapsBetweenAppearances = _.reduce(tripTrackingMap, function (acc, locArrArr, key) {

        var firstOccurance = _.first(_.first(locArrArr)) ,
            lastOccurance  = _.last(_.last(locArrArr)) ;
        

        var locArrArrFiltered = locArrArr.filter(function (locArr) { return locArr.length; }),

            startEndLocArrPairs = locArrArrFiltered.map(function (locArr) {
                var firstTimestamp = _.first(locArr).timestamp,
                    firstMsgNum    = timestampToMessageNumber[firstTimestamp], 
                    firstStopId    = _.first(locArr).stopId ,

                    lastTimestamp  = _.last(locArr).timestamp ,
                    lastMsgNum     = timestampToMessageNumber[lastTimestamp] ,
                    lastStopId     = _.last(locArr).stopId ;
                

                //if ((firstMsgNum === null) && (lastMsgNum === null)) { 
                    //console.log('**************** Why nulls ? ****************');
                    //console.log(firstMsgNum + ':' + lastMsgNum);
                    //console.log(locArr); 
                    //console.log('*********************************************');
                //}

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
                firstOccurance: firstOccurance, 
                lastOccurance: lastOccurance,
                timeInSystem: lastOccurance.timestamp - firstOccurance.timestamp ,
                distTraveled: lastOccurance.distTraveled ,
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

                    if (mph) { allSpeeds.push(mph); }

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


process.on('exit', function () {
    
    var analysis = {
            assigningCoordinates : analyzeTripsWithCoords() ,
            lostTrains           : analyzeLostTrainOccurances() ,
            appearances          : analyzeTripAppearances() ,
            stealthTrains        : stealthTrains ,
            speeds: analyzeDistancesTraveled() ,
        } ;

    require('fs').writeFileSync('analysis.json', JSON.stringify(analysis, null, 4));
});



function feedListener (err, gtfsrtJSON, siriJSON, converterCache) {
    //========== Get the data to be reused by all analyzers =========

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


        if (unschedMap[gtfsrtKey] || noDataMap[gtfsrtKey]) { return; }
        
        trackedTrainGTFSrtKeys.push(gtfsrtKey) ;

        gtfsrtKeyToGTFSKey[gtfsrtKey] = gtfsKey ;

        coordsMap[gtfsrtKey] = vehAct.MonitoredVehicleJourney.VehicleLocation ;
    }) ;


    (function () {
        if (!trackingAll) { return; }

        _.forEach(trackedTrainGTFSrtKeys, function (key) {
            if (!coordsMap[key].Longitude) {
                if (!stealthTrains[key]) {
                    stealthTrains[key] = gtfsrtTimestamp;
                }
            }
        });
    }());

    (function () {
        var tripsCount = 0,
            withCoordsCounter = 0 ;

        _.forEach(trackedTrainGTFSrtKeys, function (key) {
            
            ++tripsCount ;

            if (coordsMap[key].Longitude) { ++withCoordsCounter ; }    
        });

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

        //console.log('###', lostTrainCount + '/' + trainHadLocationCount);
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

            //console.log(tripTrackingMap[key]) ;
        }) ;
    }());

    carryOverTrainsMap = trackedTrainGTFSrtKeys.reduce(function(acc, key) { acc[key] = 1; return acc; }, {}) ;

    prevCoordsMap = coordsMap ;

        //stealthTrainKeys = Object.keys(stealthTrains) ;
        //if (stealthTrainKeys.length) {
            //console.log(stealthTrainKeys) ;
        //}

        //console.log(JSON.stringify(_.sample(tripTrackingMap), null, 4));
}


module.exports = feedListener ;
