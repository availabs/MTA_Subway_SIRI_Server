'use strict';



var fs      = require('fs'),
    process = require('process') ,
    express = require('express') ,
    multer  = require('multer') ,
    router  = express.Router() ,
    util    = require('util') ,
    rmdir   = require('rmdir') ,

    AuthorizationService = require('../src/services/AuthorizationService') ;


    // Merge the static and hot config files.
var ConfigsService     = require('../src/services/ConfigsService') ,

    ConverterService   = require('../src/services/ConverterService') ,
    
    SystemStatusService = require('../src/services/SystemStatusService') ,

    
    eventCreator = require('../src/events/ServerEventCreator') ,

    GTFS_FeedService = require('../src/services/GTFS_FeedHandlerService') ,
    GTFSRealtime_FeedService  = require('../src/services/GTFSRealtime_FeedReaderService'),

    gtfsMulterStorage = multer.diskStorage({
        destination : ConfigsService.getGTFSConfig().workDirPath,
        filename    : function (req, file, cb) {
            var feedDataZipFileName = ConfigsService.getGTFSConfig().feedDataZipFileName;
            cb(null, feedDataZipFileName);
        },
    }),

    gtfsrtMulterStorage = multer.diskStorage({
        destination : ConfigsService.getGTFSRealtimeConfig().protofileDirPath,
        filename    : function (req, file, cb) {
            cb(null, file.originalname);
        },
    }),

    gtfsMulter   = multer({ storage: gtfsMulterStorage   }).single('zipfile'),
    gtfsrtMulter = multer({ storage: gtfsrtMulterStorage }).single('protofile');




router.post('/start/Converter', function (req, res) {
    
    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        ConverterService.start(function (err) {
            if (err) {
                return res.status(500).send({ 
                    message: 'An error occurred while starting the Converter.', 
                    error: (err.stack | err)
                });
            } else {
                return res.status(200).send('Converter service started.') ;
            }
        }) ;
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});


router.post('/stop/Converter', function (req, res) {

    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        ConverterService.stop(function (err) {
            if (err) {
                return res.status(500).send({ 
                    message: 'An error occurred while stopping the Converter.', 
                    error: (err.stack | err)
                });
            } else {
                return res.status(200).send('Converter service stopped.') ;
            }
        }) ;
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});



//================ Config GET endpoints ================\\

router.get('/get/Logging/config', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(ConfigsService.getLoggingHotConfig());
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.get('/get/GTFS/config', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(ConfigsService.getGTFSHotConfig());
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.get('/get/GTFS-Realtime/config', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(ConfigsService.getGTFSRealtimeHotConfig());
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.get('/get/Converter/config', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(ConfigsService.getConverterHotConfig());
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.get('/get/GTFS-Realtime/currentTimestamp', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(JSON.stringify(ConverterService.getCurrentGTFSRealtimeTimestamp()));
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.get('/get/GTFS-Realtime/feed-reader/state', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(util.inspect(GTFSRealtime_FeedService.getFeedReaderState()) + '\n');
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});


router.get('/get/server/memory-usage', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(process.memoryUsage());
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.get('/get/server/state', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        return res.send(ConverterService.getState());
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

//================ Config POST endpoints ================\\
 

router.post('/update/GTFS/config', function(req, res) {
    console.log("===== UPDATE GTFS Config =====");

    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        try {
            gtfsMulter(req, res, function (err) {
                var gtfsConfig,
                    newConfig,
                    errorMessage ;

                if (err) {
                    eventCreator.emitGTFSServiceStatus({
                        error: "An error occurred while updating the GTFS configuration." ,
                        debug: (err.stack || err) ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });
                    eventCreator.emitError({ error: err });

                    return res.status(500).send({ error: err.message });
                } else {

                    eventCreator.emitGTFSServiceStatus({
                        info: 'Server received request to update the GTFS configuration (but not the feed data).' ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });

                    if (req.file) {
                        errorMessage = "ERROR: Non-null data file send to admin/update/GTFS/config.\n" +
                                       "GTFS data updates must use the /admin/update/GTFS/data route.\n" +
                                       "All configuration changes sent with the file will be discarded.\n";

                        gtfsConfig = ConfigsService.getGTFSConfig();

                        rmdir(gtfsConfig.workDirPath, function (err) {
                            if (err) {
                                eventCreator.emitError({ error: err });
                                errorMessage += 
                                    "\n\tAn error occurred while attempting to delete the uploaded file:\n" + err;

                                eventCreator.emitGTFSServiceStatus({
                                    error: errorMessage ,
                                    debug: (err.stack || err) ,
                                    timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                });

                            } else {
                                errorMessage += "\n\tThe uploaded file was deleted.";

                                eventCreator.emitGTFSServiceStatus({
                                    error: errorMessage ,
                                    timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                });
                            } 

                            return res.status(500).send({ error: errorMessage });
                        }); 
                    } else {
                        eventCreator.emitGTFSServiceStatus({
                            debug: 'Sending the GTFS config request to the ConfigsService.' ,
                            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                        });

                        Object.keys(req.body).reduce(function (acc, key) {
                            if (key !== 'zipfile') {
                                acc[key] = req.body[key] ;
                            } 
                        
                            return acc;
                        }, (newConfig = {}));

                        ConfigsService.updateGTFSConfig(newConfig, function (err) {
                            if (err) {
                                var msg = {
                                        debug: (err.stack || err) ,
                                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                    } ,

                                    desc = 'Server encountered an error while updating the GTFS configuration:\n' + 
                                            err.message ;

                                msg[ConfigsService.gtfsIsConfigured() ? 'info' : 'error'] = desc;

                                eventCreator.emitGTFSServiceStatus(msg);
                                eventCreator.emitError({ error: err });

                                return res.status(500).send({ error: desc });
                            } else {
                                eventCreator.emitGTFSServiceStatus({
                                    info: 'GTFS configuration update successful. Changes will take place immediately.' ,
                                    timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                });

                                return res.status(200).send("GTFS configuration update successful.\n" +
                                                     "Changes will take place immediately.");
                            }
                        });
                    }
                }
            });
        } catch (err) {
            eventCreator.emitGTFSServiceStatus({
                error: "An error occurred while updating the GTFS configuration." ,
                debug: (err.stack || err) ,
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });
            eventCreator.emitError({ error: err });

            return res.status(500).send({ error: err.message });
        }
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});


router.post('/update/GTFS/data', function(req, res) {
    // TODO: Implement lock to ensure only one update at a time.

    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        try {
            SystemStatusService.resetGTFSLastDataUpdateLog() ;

            eventCreator.emitGTFSDataUpdateStatus({
                info: 'Server received request to update the GTFS feed data.' ,
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            console.log("===== UPDATE GTFS Data =====");

            gtfsMulter(req, res, function (err) {
                var newConfig = {},
                    keys,
                    i;

                if (err) {

                    eventCreator.emitGTFSDataUpdateStatus({
                        error: 'Server encountered an error while updating the GTFS feed data.' ,
                        debug: (err.stack || err) ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });
                    eventCreator.emitError({ error: err });

                    return res.status(500).send("Server error while updating the GTFS feed data.");

                } else {
                    keys = Object.keys(req.body);

                    for ( i = 0; i < keys.length; ++i ) {
                        if (keys[i] !== 'zipfile') {
                            newConfig[keys[i]] = req.body[keys[i]];
                        } 
                    }

                    ConfigsService.updateGTFSConfig(newConfig, function (err) {

                        if (err) {
                            var msg = {
                                debug: (err.stack || err) ,
                                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                            } ;
                            msg[ConfigsService.gtfsIsConfigured() ? 'info' : 'error'] = 
                                'Server encountered an error while updating the GTFS configuration:\n' + 
                                err.message ;

                            eventCreator.emitGTFSServiceStatus(msg);

                            eventCreator.emitError({ error: err });

                            return res.status(500).send("Server error while updating the GTFS configuration.");

                        } else {

                            GTFS_FeedService.updateFeedHandler((req.file) ? "file" : "url", gtfsDataUpdateCallback);

                            eventCreator.emitGTFSDataUpdateStatus({
                                debug: 'GTFS_Toolkit component data hot update started.' ,
                                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                            });
                            
                            // Immediate response. Client should poll for status updates.
                            return res.status(200).send("GTFS update process started.");
                        }
                    });
                }
            });
        } catch (err) {
            eventCreator.emitGTFSDataUpdateStatus({
                error: 'Server encountered an error while updating the GTFS feed data.' ,
                debug: (err.stack || err) ,
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });
            eventCreator.emitError({ error: err });

            return res.status(500).send("Server error while updating the GTFS feed data.");
        }
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});


function finishGTFSrtUpdate (req, res) {
    // Convert all stringified numbers in the request body to floats.
    var newConfig = {};


    Object.keys(req.body).reduce(function (acc, key) {
        if (! isNaN(parseInt(req.body[key]))) {
           acc[key] = parseFloat(req.body[key]); 
        } else if (key !== "protofile") {
            acc[key] = req.body[key];
        }

        return acc;
    }, newConfig);

    // We need to update the profileName after an upload. (User can set the filename.)
    if (req.file) {
        newConfig.protofileName = req.file.filename;
    }
    newConfig.protofile = undefined;

    // Note: The following function will send updates to the GTFS-Realtime_Toolkit.FeedReader.
    ConfigsService.updateGTFSRealtimeConfig(newConfig, function (err) {
        if (err) {
            var msg = {
                    debug: (err.stack || err) ,
                    timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                } ,
        
                desc = 'Server encountered an error while updating the GTFS-Realtime configuration:\n' + err.message ;
                    

            msg[ConfigsService.gtfsrtIsConfigured() ? 'info' : 'error'] = desc ;

            eventCreator.emitGTFSRealtimeServiceStatus(msg);
            eventCreator.emitError({ error: err });

            console.log(err);

            return res.status(500).send({ error: desc });

        } else {
            eventCreator.emitGTFSRealtimeServiceStatus({
                info: 'GTFS-Realtime configuration update successful.',
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });
            return res.status(200).send('Update successful.');
        }
    });
}


router.post('/update/GTFS-Realtime/config', function (req, res) {

    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {

        var oldConfig = ConfigsService.getGTFSRealtimeConfig();

        try {
            gtfsrtMulter(req, res, function (err) {

                if (err) {
                    eventCreator.emitGTFSRealtimeServiceStatus({
                        error: 'Server encountered an error while updating the GTFS-Realtime configuration.' ,
                        debug: (err.stack || err) ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });
                    eventCreator.emitError({ error: err });

                    return res.status(500).send({ error: "A server error occurred while processing the request." });

                } else {
                    // Was the protofile renamed? If so, we delete the old one.
                    if (req.file && (req.file.filename !== oldConfig.protofileName)) {
                        
                        eventCreator.emitGTFSRealtimeServiceStatus({
                            debug: 'Removing the old GTFS-Realtime .proto file.',
                            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                        });

                        // Remove the old protofile
                        fs.access(oldConfig.protofileName, fs.W_OK, function (err) {
                            if (err) {
                                // Previous protofile cannot be deleted.
                                eventCreator.emitGTFSRealtimeServiceStatus({
                                    error: 'GTFS-Realtime config update cannot delete the old .proto file.' ,
                                    debug: (err.stack || err),
                                    timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                });
                                eventCreator.emitError({ error: err });

                               return finishGTFSrtUpdate(req, res); 
                            } else {
                                fs.unlink(oldConfig.protofilePath, function (err) {
                                    if (err) {
                                        eventCreator.emitGTFSRealtimeServiceStatus({
                                            error: 'GTFS-Realtime config update failed to delete the old .proto file.' ,
                                            debug: (err.stack || err),
                                            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                        });
                                        eventCreator.emitError({ error: err });

                                       return res.status(500).send({ error: err.message });
                                    } else {
                                        eventCreator.emitGTFSRealtimeServiceStatus({
                                            debug: 'Successfully deleted the old GTFS-Realtime .proto file.',
                                            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                                        });
                                       return finishGTFSrtUpdate(req, res);
                                    }
                                });
                            }
                        });

                    } else { //
                        return finishGTFSrtUpdate(req, res);
                    }
                }
            });
        } catch (err) {
            eventCreator.emitGTFSRealtimeServiceStatus({
                error: 'GTFS-Realtime config update encountered an error.' ,
                debug: (err.stack || err),
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });
            eventCreator.emitError({ error: err });

            return res.status(500).send({ error: err.message });
        }

    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});


router.post('/update/Logging/config', function (req, res) {

    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        try {
            var loggingHotConfig = ConfigsService.getLoggingHotConfig(),
                
                  newConfig = Object.keys(loggingHotConfig || {}).reduce(function (acc, key) {
                                    acc[key] = !!req.body[key];
                                    return acc;
                                }, {});

            newConfig.daysToKeepLogsBeforeDeleting = req.body.daysToKeepLogsBeforeDeleting || 0;

            eventCreator.emitLoggingStatus({
                info: 'Server received request for Logging configuration update.' ,
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            ConfigsService.updateLoggingConfig(newConfig, function (err) {
                if (err) {
                    eventCreator.emitLoggingStatus({
                        info: 'Logging configuration update failed with the following error:\n' + err.message ,
                        debug: (err.stack || err) ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });

                    return res.status(500).send({ error: err.message });
                } else {
                    eventCreator.emitLoggingStatus({
                        info: 'Logging configuration update complete.' ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });

                    return res.status(200).send('Update successful.');
                }
            });

        } catch (err) {
            return res.status(500).send({ error: err.message });
        }
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});

router.post('/update/Converter/config', function(req, res) {

    var key = req.body && req.body.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {

        var newConfig  = {},
            configKeys = ((req.body !== null) && (typeof req.body === 'object')) && Object.keys(req.body),
            onOffKey,
            i;

        SystemStatusService.resetConverterConfigUpdateLog() ;

        eventCreator.emitConverterServiceStatus({
            info: 'Server received request for Converter configuration update.' ,
            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


        for ( i = 0; i < configKeys.length; ++i ) {
            onOffKey = configKeys[i].replace('LoggingLevel', '');
            onOffKey = 'log' + onOffKey[0].toUpperCase() + onOffKey.slice(1);

            newConfig[configKeys[i]] = req.body[configKeys[i]];
            newConfig[onOffKey]      = (req.body[configKeys[i]] !== 'off');
        }

        ConfigsService.updateConverterConfig(newConfig, function (err) {
            if (err) {

                var msg = {
                        debug: (err.stack || err) ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    } ,

                    desc = 'Server encountered an error while updating the Converter configuration:\n' + err.message ;


                msg[ConfigsService.converterIsConfigured() ? 'info' : 'error'] = desc ;

                eventCreator.emitConverterServiceStatus(msg);
                eventCreator.emitError({ error: err });

                return res.status(500).send({ error: desc });

            } else {
                eventCreator.emitConverterServiceStatus({
                    info: 'Converter configuration update successful.' ,
                    timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                });

                return res.status(200).send('Update successful.');
            }
        });
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});



//TODO: Move the lastGTFSDataUpdateResults to the SystemStatusService
router.get('/get/system/status', function (req, res) {
    var key = req.query && req.query.key;

    if (key && AuthorizationService.isAdminAuthorized(key)) {
        var sysStatus = SystemStatusService.getSystemStatus() ;
        return res.status(200).send(sysStatus);
    } else {
        return res.status(401).send('Admin authorization key required.');
    }
});


function gtfsDataUpdateCallback (err) {
    if (err) {
        eventCreator.emitGTFSDataUpdateStatus({
            debug: 'Admin console received an error from the GTFS_FeedService.update callback.' ,
            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });
    } else {
        eventCreator.emitGTFSDataUpdateStatus({
            debug: 'Admin console received an "all-clear" from the GTFS_FeedService.update callback.' ,
            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });
    }
}


module.exports = router;

