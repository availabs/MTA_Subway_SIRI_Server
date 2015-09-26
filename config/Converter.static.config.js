'use strict';

var path    = require('path') ,
    logsDir = path.normalize(path.join(__dirname, '../logs/')) ;

module.exports = {
    logsDir                   : logsDir                                      ,

    locationsLogPath          : path.join(logsDir, 'locations.csv')          ,

    trainTrackingStatsLogPath : path.join(logsDir, 'trainTrackingStats.csv') ,

    unscheduledTripsLogPath   : path.join(logsDir, 'unscheduledTrips.log')   ,

    noSpatialDataTripsLogPath : path.join(logsDir, 'noSpatialDataTrips.log') ,

    lostTrainsLogPath         : path.join(logsDir, 'lostTrains.log')         ,
};

