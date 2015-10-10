'use strict';


var winston = require('winston');

var ConfigsService = require('../services/ConfigsService'),

    gtfsrtConfig    = ConfigsService.getGTFSRealtimeConfig(),
    converterConfig = ConfigsService.getConverterConfig();




winston.loggers.add('gtfsrt_feed_reader', {
    file: {
        filename    : gtfsrtConfig.feedReaderLogPath,
        prettyPrint : true,
        level       : gtfsrtConfig.feedReaderLoggingLevel,
        colorize    : true,
        label       : 'Feed Reader Logging'
    }
});
//}).remove(winston.transports.Console);


winston.loggers.add('converter_train_locations', {
    file: {
        filename  : converterConfig.trainLocationsLogPath,
        prettyPrint : true,
        level     : converterConfig.trainLocationsLoggingLevel,
        colorize  : true,
        stringify : stringifyAsCSV,
        label     : 'Converter Train Locations'
    }
}).remove(winston.transports.Console);

winston.loggers.add('converter_train_tracking_stats', {
    file: {
        filename  : converterConfig.trainTrackingStatsLogPath,
        prettyPrint : true,
        level     : converterConfig.trainTrackingStatsLoggingLevel,
        colorize  : false,
        stringify : stringifyAsCSV,
        label     : 'Converter Train Tracking Stats',
    }
}).remove(winston.transports.Console);

winston.loggers.add('converter_no_spatial_data_trips', {
    file: {
        filename : converterConfig.noSpatialDataTripsLogPath,
        prettyPrint : true,
        level    : converterConfig.noSpatialDataTripsLoggingLevel,
        colorize : false,
        stringify : simpleString,
        label    : 'No Spatial Data Trips',
    }
}).remove(winston.transports.Console);

winston.loggers.add('converter_unscheduled_trips', {
    file: {
        filename : converterConfig.unscheduledTripsLogPath,
        prettyPrint : true,
        level    : converterConfig.unscheduledTripsLoggingLevel,
        colorize : false,
        stringify : simpleString,
        label    : 'Unscheduled Trips',
    }
}).remove(winston.transports.Console);


winston.loggers.add('converter_train_tracking_errors', {
    file: {
        filename : converterConfig.trainTrackingErrorsLogPath,
        prettyPrint : true,
        level    : converterConfig.trainTrackingErrorsLoggingLevel,
        colorize : false,
        label    : 'Train Tracking Errors',
    }
}).remove(winston.transports.Console);




function stringifyAsCSV (options) {
    return (Array.isArray(options.data)) ? [options.timestamp].concat(options.data).join(',') : '';
}

function simpleString (options) {
    return (options.data) ? options.data.toString() : '';
}


