'use strict';

var fs    = require('fs') ,
    path  = require('path') ,
    merge = require('merge') ,

    logsDir = path.normalize(path.join(__dirname, '../logs/')) ,

    hotConfigPath = path.join(__dirname, './Logging.hot.config.json'),

    hotConfig = JSON.parse(fs.readFileSync(hotConfigPath)) ;



var staticConfig = {
    logsDir                    : logsDir ,

    dataAnomaliesLogPath       : path.join(logsDir, 'dataAnomalies.log') ,

    errorsLogPath              : path.join(logsDir, 'errors.log') ,

    feedReaderLogPath          : path.join(logsDir, 'gtfsrtFeedReader.log') ,

    converterLogPath           : path.join(logsDir, 'converter.log') ,

    trainLocationsLogPath      : path.join(logsDir, 'trainLocations.log') ,

    trainTrackingStatsLogPath  : path.join(logsDir, 'trainTrackingStats.log') ,

    unscheduledTripsLogPath    : path.join(logsDir, 'unscheduledTrips.log') ,

    noSpatialDataTripsLogPath  : path.join(logsDir, 'noSpatialDataTrips.log') ,

    trainTrackingErrorsLogPath : path.join(logsDir, 'trainTrackingErrors.log'),
};


module.exports = merge(staticConfig, hotConfig);
