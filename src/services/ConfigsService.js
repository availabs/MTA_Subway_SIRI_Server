'use strict';

var fs    = require('fs')    ,
    path  = require('path')  ,
    merge = require('merge') ;

var gtfsHotConfigPath = path.join(__dirname, '../../config/GTFS.hot.config.json') ,
    gtfsStaticConfig  = require('../../config/GTFS.static.config') , 
    gtfsHotConfig     = JSON.parse(fs.readFileSync(gtfsHotConfigPath)) ,
    gtfsConfig        = merge(gtfsStaticConfig, gtfsHotConfig) ,

    gtfsrtHotConfigPath  = path.join(__dirname, '../../config/GTFS-RealtimeFeedReader.hot.config.json') ,
    gtfsrtAPIKeyPath     = path.join(__dirname, '../../config/GTFS-RealtimeAPI.key.json') ,
    gtfsrtStaticConfig   = require('../../config/GTFS-RealtimeFeedReader.static.config.js') ,
    gtfsrtHotConfig      = JSON.parse(fs.readFileSync(gtfsrtHotConfigPath)) ,
    gtfsrtConfig         = merge(gtfsrtStaticConfig, gtfsrtHotConfig) ,
    gtfsrtAPIKey         = JSON.parse(fs.readFileSync(gtfsrtAPIKeyPath)).key,


    converterHotConfigPath  = path.join(__dirname, '../../config/Converter.hot.config.json'),
    converterStaticConfig   = require('../../config/Converter.static.config.js') ,
    converterHotConfig      = JSON.parse(fs.readFileSync(converterHotConfigPath)) ,
    converterConfig         = merge(converterStaticConfig, converterHotConfig) ;




var api = {

    getGTFSConfig : function () {
        return gtfsConfig;
    },

    getGTFSRealtimeConfig : function () {
        gtfsrtConfig.feedURL = gtfsrtConfig.baseURL + gtfsrtAPIKey;

        return gtfsrtConfig;
    },

    getConverterConfig : function () {
        console.log(converterConfig);

        return converterConfig;
    },

};


module.exports = api;


