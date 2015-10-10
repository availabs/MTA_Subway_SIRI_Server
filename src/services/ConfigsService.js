'use strict';

var fs    = require('fs')    ,
    path  = require('path')  ,
    merge = require('merge') ;

var gtfsHotConfigPath = path.join(__dirname, '../../config/GTFS.hot.config.json') ,
    gtfsHotConfig     = JSON.parse(fs.readFileSync(gtfsHotConfigPath)),
    gtfsConfig        = require('../../config/GTFS.config') , 

    gtfsrtHotConfigPath  = path.join(__dirname, '../../config/GTFS-RealtimeFeedReader.hot.config.json') ,
    gtfsrtHotConfig      = JSON.parse(fs.readFileSync(gtfsrtHotConfigPath)),
    gtfsrtConfig         = require('../../config/GTFS-RealtimeFeedReader.config') ,

    converterHotConfigPath  = path.join(__dirname, '../../config/Converter.hot.config.json'),
    converterHotConfig      = JSON.parse(fs.readFileSync(converterHotConfigPath)),
    converterConfig         = require('../../config/Converter.config') ,

    //memwatchHotConfigPath  = path.join(__dirname, '../../config/Memwatch.hot.config.json'),
    //memwatchHotConfig      = JSON.parse(fs.readFileSync(memwatchHotConfigPath)),
    memwatchConfig         = require('../../config/Memwatch.config'),

    gtfsConfigUpdateListeners      = [] ,
    gtfsrtConfigUpdateListeners    = [] ,
    converterConfigUpdateListeners = [] ;




var api = {

    getGTFSConfig : function () {
        return gtfsConfig;
    },

    getGTFSHotConfig : function () {
        return gtfsHotConfig;
    },

    updateGTFSConfig : function (newHotConfig, callback) {
        gtfsHotConfig = newHotConfig;

        merge(gtfsConfig, gtfsHotConfig);

        fs.writeFile(gtfsHotConfigPath, JSON.stringify(newHotConfig, null, '    ') + '\n', function (err) {
            if (err) {
                callback(err);
                return;
            }

            for (var i = 0; i < gtfsConfigUpdateListeners.length; ++i) {
                gtfsConfigUpdateListeners[i](gtfsConfig);
            }
            callback();
        });
    },

    addGTFSConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            gtfsConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeGTFSConfigUpdateListener : function (listener) {
        for (var i = 0; i < gtfsConfigUpdateListeners.length; ++i) {
            if (gtfsConfigUpdateListeners[i] === listener) {
                gtfsConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },



    getGTFSRealtimeConfig : function () {
        return gtfsrtConfig;
    },

    getGTFSRealtimeHotConfig : function () {
        return gtfsrtHotConfig;
    },

    // The caller of this function must handle creating 
    // the complete feedURL which includes the API key.
    updateGTFSRealtimeConfig : function (newHotConfig, callback) {
        gtfsrtHotConfig = newHotConfig;

        merge(gtfsrtConfig, newHotConfig);

        gtfsrtConfig.feedURL = gtfsrtHotConfig.baseURL + '?key=' + gtfsrtHotConfig.apiKey;

        fs.writeFile(gtfsrtHotConfigPath, JSON.stringify(newHotConfig, null, '    ') + '\n', function (err) {
            if (err) {
                callback(err);
                return;
            }
            
            for (var i = 0; i < gtfsrtConfigUpdateListeners.length; ++i) {
                gtfsrtConfigUpdateListeners[i](gtfsrtConfig);
            }
            callback();
        });
    },

    addGTFSRealtimeConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            gtfsrtConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeGTFSrtConfigUpdateListener : function (listener) {
        for (var i = 0; i < gtfsrtConfigUpdateListeners.length; ++i) {
            if (gtfsrtConfigUpdateListeners[i] === listener) {
                gtfsrtConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },



    getConverterConfig : function () {
        converterConfig.gtfsConfig = gtfsConfig;
        converterConfig.gtfsrtConfig = gtfsrtConfig;

        return converterConfig;
    },

    getConverterHotConfig : function () {
        return converterHotConfig;
    },

    updateConverterConfig : function (newHotConfig, callback) {
        converterHotConfig = newHotConfig;

        merge(converterConfig, newHotConfig);

        fs.writeFile(converterHotConfigPath, JSON.stringify(newHotConfig, null, '    ') + '\n', function (err) {
            if (err) {
                callback(err);
                return;
            }

            for (var i = 0; i < converterConfigUpdateListeners.length; ++i) {
                converterConfigUpdateListeners[i](converterConfig);
            }
            callback();
        });
    },


    addConverterConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            converterConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeConverterConfigUpdateListener : function (listener) {
        for (var i = 0; i < converterConfigUpdateListeners.length; ++i) {
            if (converterConfigUpdateListeners[i] === listener) {
                converterConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },


    getMemwatchConfig : function () {
        return memwatchConfig;
    },


};


module.exports = api;

