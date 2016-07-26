#!/usr/bin/env node

'use strict';

var fs          = require('fs') ,
    path        = require('path'),
    readline    = require('readline'),
    Converter   = require("csvtojson").Converter ,
    async       = require('async') ,
    _           = require('lodash') ;



var configsService = require('../src/services/ConfigsService'),

    gtfsConfig = configsService.getGTFSConfig() ,
    converterConfig = configsService.getConverterConfig() ,

    gtfsTripKeyMutator = (Array.isArray(gtfsConfig.tripKeyMutator)) ? gtfsConfig.tripKeyMutator : null,

    gtfsTripsDataPath = './GTFS/trips.txt';

//var unscheduledTripsLogPath = converterConfig.unscheduledTripsLogPath ;
var unscheduledTripsLogPath = path.join(__dirname, './feedReplay/logs/mta_subway_unscheduledTrips.log');



function getScheduledTrips (callback) {
    var converter = new Converter({constructResult:true}) ,
        fileStream = fs.createReadStream(gtfsTripsDataPath);

    converter.on("end_parsed", function (parsedTable) {
        callback(null, parsedTable.map(function (row) { 
            return gtfsTripKeyMutator ? 
                row.trip_id.replace(gtfsTripKeyMutator[0], gtfsTripKeyMutator[1]) : 
                row.trip_id;
        }));
    });

    fileStream.pipe(converter);
}


function getUnscheduledTrips (callback) {
    var unscheduledTrips = {};

    var lineReader = readline.createInterface({
        input: fs.createReadStream(unscheduledTripsLogPath) ,
    }) ;

    lineReader.on('line', function (line) {
        var lineAsJSON       = JSON.parse(line) ;

        lineAsJSON.unscheduledTrips.reduce(function (acc, unscheduledTrip) {
            acc[unscheduledTrip] = 1; 
            return acc;
        }, unscheduledTrips);
    });

    lineReader.on('close', function () { callback(null, Object.keys(unscheduledTrips)); });
}


function verify (err, results) {
    if (err) {
        console.error('ERROR encountered while verifing unscheduledTrips do not appear in the GTFS feed.');
        console.error((err && err.stack) || err);
    }

    console.log(_.sample(results.unscheduledTrips));
    console.log(_.sample(results.scheduledTrips));

    var setIntersection = _.intersection(results.unscheduledTrips, results.scheduledTrips);

    if (setIntersection.length) {
        console.error('ERROR: The following trips were logged as unscheduledTrips. ' +
                      'However, they exist in trips.txt.');

        console.error(setIntersection);
    } 
}


async.parallel({ scheduledTrips: getScheduledTrips, unscheduledTrips: getUnscheduledTrips }, verify);

