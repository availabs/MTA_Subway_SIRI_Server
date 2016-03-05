'use strict';

var fs          = require('fs') ,
    readline    = require('readline'),
    Converter   = require("csvtojson").Converter ,
    async       = require('async') ,
    _           = require('lodash') ;



var configsService = require('../src/services/ConfigsService'),
    gtfsConfig = configsService.getGTFSConfig() ,
    converterConfig = configsService.getConverterConfig() ;



function getTripKeysToShapeIDs (callback) {
    var converter          = new Converter({constructResult:true}) ,
        gtfsTripsDataPath  = './GTFS/trips.txt' ,
        fileStream         = fs.createReadStream(gtfsTripsDataPath) ,
        gtfsTripKeyMutator = (Array.isArray(gtfsConfig.tripKeyMutator)) ? 
                                gtfsConfig.tripKeyMutator : null ;

    converter.on("end_parsed", function (parsedTable) {
        callback(null, parsedTable.reduce(function (acc, row) { 
            var tripKey = gtfsTripKeyMutator ? 
                            row.trip_id.replace(gtfsTripKeyMutator[0], gtfsTripKeyMutator[1]) : 
                            row.trip_id;

            acc[tripKey] = row.shape_id;

            return acc;
        }, {}));
    });

    fileStream.pipe(converter);
}

function getShapeIDs (callback) {
    var converter     = new Converter({constructResult:true}) ,
        shapesDataPath = './GTFS/shapes.txt' ,
        fileStream    = fs.createReadStream(shapesDataPath);

    converter.on("end_parsed", function (parsedTable) {
        var shapeIDBloomFilter = {};

        parsedTable.reduce(function (acc, row) { 
            acc[row.shape_id] = 1;
            return acc;
        }, shapeIDBloomFilter);
        
        callback(null, shapeIDBloomFilter);
    });

    fileStream.pipe(converter);
}


function getNoSpatialDataTrips (callback) {
    var noSpatialDataTripsLogPath = converterConfig.noSpatialDataTripsLogPath ,
        noSpatialDataTrips = {} ;

    var lineReader = readline.createInterface({
        input: fs.createReadStream(noSpatialDataTripsLogPath) ,
    }) ;

    lineReader.on('line', function (line) {
        var lineAsJSON = JSON.parse(line) ;

        lineAsJSON.noSpatialDataTrips.reduce(function (acc, noSpatialDataTrip) {
            acc[noSpatialDataTrip] = 1; 
            return acc;
        }, noSpatialDataTrips);
    });

    lineReader.on('close', function () { callback(null, Object.keys(noSpatialDataTrips)); });
}


function verify (err, results) {
    if (err) {
        console.error('ERROR encountered while verifing unscheduledTrips do not appear in the GTFS feed.');
        console.error((err && err.stack) || err);
    }

    var scheduledTrips = Object.keys(results.tripKeysToShapeIDs);

    //console.log(_.sample(results.noSpatialDataTrips));
    //console.log(_.sample(scheduledTrips));

    var unscheduledNoSpatialData = _.difference(results.noSpatialDataTrips, scheduledTrips);

    if (unscheduledNoSpatialData.length) {
        console.error('ERROR: The following trips were logged as scheduled but lacking shapesDataPath. ' +
                      '       However, they do not exist in trips.txt.');

        console.error(unscheduledNoSpatialData);
    } 

    var haveSpatialData = [];

    results.noSpatialDataTrips.reduce(function (acc, tripKey) {
        var shapeID = results.tripKeysToShapeIDs[tripKey];

        if ((shapeID !== undefined) && (shapeID !== '')) {
            
            console.log('listed in trips.txt:', '--' + shapeID + '--');
            shapeID = results.shapeIDBloomFilter[shapeID];

            if (shapeID !== undefined) {
                acc.push(tripKey);
                return acc;
            }
        } 

        return acc;
    }, haveSpatialData);

    if (haveSpatialData.length) {
        console.error('The following trips were not tracked because the system labeled them as noSpatialData, ' +
                      'when in fact they have spatial data.');

        console.log(haveSpatialData);
    }


}


async.parallel({ 
        tripKeysToShapeIDs: getTripKeysToShapeIDs , 
        noSpatialDataTrips: getNoSpatialDataTrips ,
        shapeIDBloomFilter:           getShapeIDs ,
    }, verify);




