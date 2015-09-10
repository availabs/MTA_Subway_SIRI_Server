'use strict';

var path           = require('path'),

    // FIXME: Find a better way.
    tripKeyBuilder = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit.tripKeyBuilder,

    dataDirPath    = path.normalize(path.join(__dirname, '../data/GTFS/'));

module.exports = {
    gtfsConfigFilePath          : __filename                                                           ,

    latestDataURL               : "http://web.mta.info/developers/data/nyct/subway/google_transit.zip" ,

    tripKeyBuilder              : tripKeyBuilder                                                       ,

    dataDirPath                 : dataDirPath                                                          ,
    tmpDirPath                  : path.join(dataDirPath, 'tmp')                                        ,

    indexedScheduleDataFileName : 'indexedScheduleData.json'                                           ,
    indexedSpatialDataFileName  : 'indexedSpatialData.json'                                            ,
    indexingStatisticsFileName  : 'indexingStatistics.json'                                            ,
};
