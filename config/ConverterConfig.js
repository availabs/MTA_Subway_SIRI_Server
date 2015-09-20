'use strict';

var path    = require('path') ,
    logsDir = path.normalize(path.join(__dirname, '../logs/')) ;

module.exports = {
    logsDir                   : logsDir                                          ,

    logTrainLocations         : true                                             ,
    locationsLogPath          : path.join(logsDir, 'locations.csv')              ,

    logTrainTrackingStats     : true                                             ,
    statsLogPathPath          : path.join(logsDir, 'trainTrackingStats.csv')     ,

    logUnscheduledTrips       : true                                             ,
    unscheduledTripsLogPath   : path.join(logsDir, 'unscheduledTrips.log')       ,

    logNoSpatialDataTrips     : true                                             ,
    noSpatialDataTripsLogPath : path.join(logsDir, 'noSpatialDataTrips.log')     ,

    logLostTrains             : true                                             ,
    lostTrainsLogPath         : path.join(logsDir, 'lostTrains.log')             ,
};

