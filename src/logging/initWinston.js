'use strict';


var winston = require('winston');

var ConfigsService = require('../services/ConfigsService'),

    gtfsrtConfig    = ConfigsService.getGTFSRealtimeConfig(),

    converterConfig = ConfigsService.getConverterConfig(),

    memwatchConfig  = ConfigsService.getMemwatchConfig();


winston.loggers.add('gtfsrt_feed_reader', {
    file: {
        filename    : gtfsrtConfig.feedReaderLogPath,
        //stringify   : feedReaderStringifier,
        level       : gtfsrtConfig.feedReaderLoggingLevel,
        colorize    : true,
        label       : 'Feed Reader Logging'
    }
}).remove(winston.transports.Console);


winston.loggers.add('converter', {
    file: {
        filename    : converterConfig.converterLogPath,
        level       : converterConfig.converterLoggingLevel,
        colorize    : true,
        label       : 'Converter Logging'
    }
}).remove(winston.transports.Console);





//winston.loggers.add('converter_train_locations', {
    //file: {
        //filename  : converterConfig.trainLocationsLogPath,
        //level     : converterConfig.trainLocationsLoggingLevel,
        //colorize  : true,
        //stringify : stringifyAsCSV,
        //label     : 'Converter Train Locations'
    //}
//}).remove(winston.transports.Console);

//winston.loggers.add('converter_train_tracking_stats', {
    //file: {
        //filename  : converterConfig.trainTrackingStatsLogPath,
        //level     : converterConfig.trainTrackingStatsLoggingLevel,
        //colorize  : false,
        //stringify : stringifyAsCSV,
        //label     : 'Converter Train Tracking Stats',
    //}
//}).remove(winston.transports.Console);

//winston.loggers.add('converter_no_spatial_data_trips', {
    //file: {
        //filename : converterConfig.noSpatialDataTripsLogPath,
        //level    : converterConfig.noSpatialDataTripsLoggingLevel,
        //colorize : false,
        //stringify : simpleString,
        //label    : 'No Spatial Data Trips',
    //}
//}).remove(winston.transports.Console);

//winston.loggers.add('converter_unscheduled_trips', {
    //file: {
        //filename : converterConfig.unscheduledTripsLogPath,
        //level    : converterConfig.unscheduledTripsLoggingLevel,
        //colorize : false,
        //stringify : simpleString,
        //label    : 'Unscheduled Trips',
    //}
//}).remove(winston.transports.Console);


//winston.loggers.add('converter_train_tracking_errors', {
    //file: {
        //filename : converterConfig.trainTrackingErrorsLogPath,
        //level    : converterConfig.trainTrackingErrorsLoggingLevel,
        //colorize : false,
        //label    : 'Train Tracking Errors',
    //}
//}).remove(winston.transports.Console);



winston.loggers.add('memwatch', {
    file: {
        filename : memwatchConfig.logFilePath,
        level    : 'silly',
        colorize : false,
        label    : 'Memory Usage',
    }
}).remove(winston.transports.Console);



//function stringifyAsCSV (options) {
    //return (Array.isArray(options.data)) ? [options.timestamp].concat(options.data).join(',') : '';
//}

//function simpleString (options) {
    //return (options.data) ? options.data.toString() : '';
//}

//function feedReaderStringifier (options) {
    //try {
        //console.log(JSON.stringify(options, null, '    '));
    //} catch (e) {
        //console.log(e);
    //}
//}

