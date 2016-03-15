'use strict';

var fs      = require('fs')      ,
    path    = require('path')    ,
    merge   = require('merge')   ;

var gtfsHotConfigPath = path.join(__dirname, '../../config/GTFS.hot.config.json') ,
    gtfsHotConfig     = JSON.parse(fs.readFileSync(gtfsHotConfigPath)),
    gtfsConfig        = require('../../config/GTFS.config') , 

    gtfsrtHotConfigPath  = path.join(__dirname, '../../config/GTFS-Realtime.hot.config.json') ,
    gtfsrtHotConfig      = JSON.parse(fs.readFileSync(gtfsrtHotConfigPath)),
    gtfsrtConfig         = require('../../config/GTFS-Realtime.config') ,

    converterHotConfigPath  = path.join(__dirname, '../../config/Converter.hot.config.json'),
    converterHotConfig      = JSON.parse(fs.readFileSync(converterHotConfigPath)),
    converterConfig         = require('../../config/Converter.config') ,

    //memwatchHotConfigPath  = path.join(__dirname, '../../config/Memwatch.hot.config.json'),
    //memwatchHotConfig      = JSON.parse(fs.readFileSync(memwatchHotConfigPath)),
    //memwatchConfig         = require('../../config/Memwatch.config'),

    loggingHotConfigPath  = path.join(__dirname, '../../config/Logging.hot.config.json'),
    loggingHotConfig      = JSON.parse(fs.readFileSync(loggingHotConfigPath)),
    loggingConfig         = require('../../config/Logging.config') ,

   
    gtfsConfigUpdateListeners      = [] ,
    gtfsrtConfigUpdateListeners    = [] ,
    converterConfigUpdateListeners = [] ,
    loggingConfigUpdateListeners   = [] ;



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
            callback(null);
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
        
        var updatedFields = Object.keys(newHotConfig),
            i;

        for ( i = 0; i < updatedFields.length; ++i ) {
            gtfsrtHotConfig[updatedFields[i]] = newHotConfig[updatedFields[i]];
        }
            
        merge(gtfsrtConfig, newHotConfig);

        // Update the path to the protofile as there may have been a new file uploaded.
        gtfsrtConfig.protofilePath = path.join(gtfsrtConfig.protofileDirPath, gtfsrtConfig.protofileName);

        fs.writeFile(gtfsrtHotConfigPath, JSON.stringify(newHotConfig, null, '    ') + '\n', function (err) {
            var listener_err = null;

            // This function is used as a callback sent to the listeners.
            // It collects the errors they may send back.
            function errorChecker (e) { listener_err = e; }

            if (err) {
                callback(err);
                return;
            }
            
            for (var i = 0; i < gtfsrtConfigUpdateListeners.length; ++i) {
                gtfsrtConfigUpdateListeners[i](gtfsrtConfig, errorChecker);

                // If the listener reported an error, break the loop.
                if (listener_err) { break; }
            }

            callback(listener_err);
        });
    },

    // listener will be passed two arguments:
    //      1. a config obj 
    //      2. a callback
    addGTFSRealtimeConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            gtfsrtConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeGTFSRealtimeConfigUpdateListener : function (listener) {
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
            callback(null);
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

    removeTrainTrackerInitialStateFromConverterConfig : function () {
        converterConfig.trainTrackerInitialState = null; // Let GC take care of this.
    } ,

    //getMemwatchConfig : function () {
        //return memwatchConfig;
    //},


    getLoggingConfig : function () {
        return loggingConfig;
    },

    getLoggingHotConfig : function () {
        return loggingHotConfig;
    },

    updateLoggingConfig : function (newHotConfig, callback) {
        loggingHotConfig = newHotConfig;

        merge(loggingConfig, newHotConfig);

        fs.writeFile(loggingHotConfigPath, JSON.stringify(newHotConfig, null, '    ') + '\n', function (err) {
            if (err) {
                callback(err);
                return;
            }

            for (var i = 0; i < loggingConfigUpdateListeners.length; ++i) {
                loggingConfigUpdateListeners[i](loggingConfig);
            }
            callback(null);
        });
    },

    addLoggingConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            loggingConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeLoggingConfigUpdateListener : function (listener) {
        for (var i = 0; i < loggingConfigUpdateListeners.length; ++i) {
            if (loggingConfigUpdateListeners[i] === listener) {
                loggingConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },



};


module.exports = api;

