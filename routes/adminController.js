'use strict';



var fs      = require('fs'),
    express = require('express') ,
    multer  = require('multer')  ,
    router  = express.Router()   ,
    util    = require('util')    ,
    rmdir   = require('rmdir')   ;


    // Merge the static and hot config files.
var ConfigsService     = require('../src/services/ConfigsService') ,

    ConverterService   = require('../src/services/ConverterService') ,
    
    SystemStatusService = require('../src/services/SystemStatusService') ,

    
    eventCreator = require('../src/events/ServerEventCreator') ,

    GTFS_FeedService = require('../src/services/GTFS_FeedHandlerService') ,
    GTFSRealtime_FeedService  = require('../src/services/GTFSRealtime_FeedReaderService'),

    gtfsMulterStorage = multer.diskStorage({
        destination : ConfigsService.getGTFSConfig().tmpDirPath,
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

    ConverterService.start(function (err) {
        if (err) {
            res.status(500).send({ 
                message: 'An error occurred while starting the Converter.', 
                error: (err.stack | err)
            });
        } else {
            res.status(200).send('Converter service started.') ;
        }
    }) ;
});


router.post('/stop/Converter', function (req, res) {

    ConverterService.stop(function (err) {
        if (err) {
            res.status(500).send({ 
                message: 'An error occurred while stopping the Converter.', 
                error: (err.stack | err)
            });
        } else {
            res.status(200).send('Converter service stopped.') ;
        }
    }) ;
});



//================ Config GET endpoints ================\\

router.get('/get/GTFS/config', function (req, res) {
    res.send(ConfigsService.getGTFSHotConfig());
});


router.get('/get/GTFS-Realtime/config', function (req, res) {
    res.send(ConfigsService.getGTFSRealtimeHotConfig());
});

router.get('/get/Converter/config', function (req, res) {
    res.send(ConfigsService.getConverterHotConfig());
});

router.get('/get/GTFS-Realtime/currentTimestamp', function (req, res) {
    res.send(JSON.stringify(ConverterService.getCurrentGTFSRealtimeTimestamp()));
});

router.get('/get/GTFS-Realtime/feed-reader/state', function (req, res) {
    res.send(util.inspect(GTFSRealtime_FeedService.getFeedReaderState()) + '\n');
});


router.get('/get/server/memory-usage', function (req, res) {
    res.send(process.memoryUsage());
});

router.get('/get/server/state', function (req, res) {
    
    res.send(ConverterService.getState());
});

//================ Config POST endpoints ================\\
 

router.post('/update/GTFS/config', function(req, res) {
    console.log("===== UPDATE GTFS Config =====");

    SystemStatusService.resetGTFSFeedUpdateLog() ;

    try {
        gtfsMulter(req, res, function (err) {
            var gtfsConfig,
                errorMessage;

            if (err) {
                eventCreator.emitGTFSFeedUpdateStatus({
                    error: "An error occurred while updating the GTFS configuration." ,
                    debug: (err.stack || err) ,
                    timestamp : Date.now() ,
                });
                eventCreator.emitError({ error: err });

                return res.status(500).send(err);
            } else {

                eventCreator.emitGTFSFeedUpdateStatus({
                    info: 'Server received request to update the GTFS configuration (but not the feed data).' ,
                    timestamp : Date.now() ,
                });

                if (req.file) {
                    errorMessage = "ERROR: Non-null data file send to admin/update/GTFS/config.\n" +
                                   "GTFS data updates must use the /admin/update/GTFS/data route.\n" +
                                   "All configuration changes sent with the file will be discarded.\n";

                    gtfsConfig = ConfigsService.getGTFSConfig();

                    rmdir(gtfsConfig.tmpDirPath, function (err) {
                        if (err) {
                            eventCreator.emitError({ error: err });
                            errorMessage += 
                                "\n\tAn error occurred while attempting to delete the uploaded file:\n" + err;

                            eventCreator.emitGTFSFeedUpdateStatus({
                                error: errorMessage ,
                                debug: (err.stack || err) ,
                                timestamp : Date.now() ,
                            });

                        } else {
                            errorMessage += "\n\tThe uploaded file was deleted.";

                            eventCreator.emitGTFSFeedUpdateStatus({
                                error: errorMessage ,
                                timestamp : Date.now() ,
                            });
                        } 

                        return res.status(500).send({ error: errorMessage });
                    }); 
                } else {
                    eventCreator.emitGTFSFeedUpdateStatus({
                        debug: 'Sending the GTFS config request to the ConfigsService.' ,
                        timestamp : Date.now() ,
                    });

                    ConfigsService.updateGTFSConfig(req.body, function (err) {
                        if (err) {
                            eventCreator.emitGTFSFeedUpdateStatus({
                                error: "An error occurred while updating the GTFS configuration." ,
                                debug: (err.stack || err) ,
                                timestamp : Date.now() ,
                            });
                            eventCreator.emitError({ error: err });

                            return res.status(500).send({ 
                                error: "An error occurred while updating the GTFS configuration:\n" + err,
                            });
                        } else {
                            eventCreator.emitGTFSFeedUpdateStatus({
                                info: 'GTFS configuration update successful. Changes will take place immediately.' ,
                                timestamp : Date.now() ,
                            });

                            return res.status(200).send("GTFS configuration update successful.\n" +
                                                 "Changes will take place immediately.");
                        }
                    });
                }
            }
        });
    } catch (err) {
        eventCreator.emitGTFSFeedUpdateStatus({
            error: "An error occurred while updating the GTFS configuration." ,
            debug: (err.stack || err) ,
            timestamp : Date.now() ,
        });
        eventCreator.emitError({ error: err });

        res.status(500).send({ error: err });
    }
});


router.post('/update/GTFS/data', function(req, res) {
    // TODO: Implement lock to ensure only one update at a time.
    try {
        SystemStatusService.resetGTFSFeedUpdateLog() ;

        eventCreator.emitGTFSFeedUpdateStatus({
            info: 'Server received request to update the GTFS feed data.' ,
            timestamp : Date.now() ,
        });

        console.log("===== UPDATE GTFS Data =====");

        gtfsMulter(req, res, function (err) {
            var newConfig = {},
                keys,
                i;

            if (err) {

                eventCreator.emitGTFSFeedUpdateStatus({
                    error: 'Server encountered an error while updating the GTFS feed data.' ,
                    debug: (err.stack || err) ,
                    timestamp : Date.now() ,
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
                        eventCreator.emitGTFSFeedUpdateStatus({
                            error: 'Server encountered an error while updating the GTFS feed data.' ,
                            debug: (err.stack || err) ,
                            timestamp : Date.now() ,
                        });
                        eventCreator.emitError({ error: err });

                        return res.status(500).send("Server error while updating the GTFS feed data.");

                    } else {

                        GTFS_FeedService.updateFeedHandler((req.file) ? "file" : "url", gtfsDataUpdateCallback);

                        eventCreator.emitGTFSFeedUpdateStatus({
                            debug: 'GTFS_Toolkit component hot update started.' ,
                            timestamp : Date.now() ,
                        });
                        
                        // Immediate response. Client should poll for status updates.
                        return res.status(200).send("GTFS update process started.");
                    }
                });
            }
        });
    } catch (err) {
        eventCreator.emitGTFSFeedUpdateStatus({
            error: 'Server encountered an error while updating the GTFS feed data.' ,
            debug: (err.stack || err) ,
            timestamp : Date.now() ,
        });
        eventCreator.emitError({ error: err });

        return res.status(500).send("Server error while updating the GTFS feed data.");
    }
});


function finishGTFSrtUpdate (req, res) {
    // Convert all stringified numbers in the request body to floats.
    var newConfig = {};

    Object.keys(req.body).reduce(function (acc, key) {
        if (! isNaN(req.body[key])) {
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

    // Note: The following function will send updates to the GTFS-Realtime_Toolkit.FeedReader.
    ConfigsService.updateGTFSRealtimeConfig(newConfig, function (err) {
        if (err) {
            eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                error: 'Server encountered an error while updating the GTFS-Realtime configuration.' ,
                debug: (err.stack || err) ,
                timestamp : Date.now() ,
            });
            eventCreator.emitError({ error: err });

            console.log(err);

            res.status(500).send({ error: err.message });

        } else {
            eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                info: 'GTFS-Realtime configuration update successful.',
                timestamp : Date.now() ,
            });

            res.status(200);
            res.send('Update successful.');
        }
    });
}


router.post('/update/GTFS-Realtime/config', function (req, res) {
    var oldConfig = ConfigsService.getGTFSRealtimeConfig();

    SystemStatusService.resetGTFSRealtimeConfigUpdateLog() ;

    try {
        gtfsrtMulter(req, res, function (err) {
            if (err) {
                eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                    error: 'Server encountered an error while updating the GTFS-Realtime configuration.' ,
                    debug: (err.stack || err) ,
                    timestamp : Date.now() ,
                });
                eventCreator.emitError({ error: err });

                res.status(500).send({ error: err });

            } else {
                // Was the protofile renamed? If so, we delete the old one.
                if (req.file && (req.file.filename !== oldConfig.protofileName)) {
                    
                    eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                        debug: 'Removing the old GTFS-Realtime .proto file.',
                        timestamp : Date.now() ,
                    });

                    // Remove the old protofile
                    fs.access(oldConfig.protofileName, fs.W_OK, function (err) {
                        if (err) {
                            // Previous protofile cannot be deleted.
                            eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                                error: 'GTFS-Realtime config update cannot delete the old .proto file.' ,
                                debug: (err.stack || err),
                                timestamp : Date.now() ,
                            });
                            eventCreator.emitError({ error: err });

                           finishGTFSrtUpdate(req, res); 
                        } else {
                            fs.unlink(oldConfig.protofilePath, function (err) {
                                if (err) {
                                    eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                                        error: 'GTFS-Realtime config update failed to delete the old .proto file.' ,
                                        debug: (err.stack || err),
                                        timestamp : Date.now() ,
                                    });
                                    eventCreator.emitError({ error: err });

                                   res.status(500).send({ error: err });
                                } else {
                                    eventCreator.emitGTFSRealtimeFeedUpdateStatus({
                                        debug: 'Successfully deleted the old GTFS-Realtime .proto file.',
                                        timestamp : Date.now() ,
                                    });
                                   finishGTFSrtUpdate(req, res);
                                }
                            });
                        }
                    });

                } else { //
                    finishGTFSrtUpdate(req, res);
                }
            }
        });
    } catch (err) {
        eventCreator.emitGTFSRealtimeFeedUpdateStatus({
            error: 'GTFS-Realtime config update encountered an error.' ,
            debug: (err.stack || err),
            timestamp : Date.now() ,
        });
        eventCreator.emitError({ error: err });

        return res.status(500).send({ error: err });
    }
});



router.post('/update/Converter/config', function(req, res) {

    var newConfig  = {},
        configKeys = ((req.body !== null) && (typeof req.body === 'object')) && Object.keys(req.body),
        onOffKey,
        i;

    SystemStatusService.resetConverterConfigUpdateLog() ;

    eventCreator.emitConverterConfigUpdateStatus({
        info: 'Server received request for Converter configuration update.' ,
        timestamp : Date.now() ,
    });


    for ( i = 0; i < configKeys.length; ++i ) {
        onOffKey = configKeys[i].replace('LoggingLevel', '');
        onOffKey = 'log' + onOffKey[0].toUpperCase() + onOffKey.slice(1);

        newConfig[configKeys[i]] = req.body[configKeys[i]];
        newConfig[onOffKey]      = (req.body[configKeys[i]] !== 'off');
    }

    ConfigsService.updateConverterConfig(newConfig, function (err) {
        if (err) {

            eventCreator.emitConverterConfigUpdateStatus({
                error: 'Converter configuration update encountered an error.' ,
                debug: (err.stack || err),
                timestamp : Date.now() ,
            });
            eventCreator.emitError({ error: err });

            res.status(500).send({ error: err });

        } else {

            eventCreator.emitConverterConfigUpdateStatus({
                info: 'Converter configuration update successful.' ,
                timestamp : Date.now() ,
            });

            res.status(200).send('Update successful.');
        }
    });
});



//TODO: Move the lastGTFSDataUpdateResults to the SystemStatusService
router.get('/get/system/status', function (req, res) {
    var sysStatus = SystemStatusService.getSystemStatus() ;
    res.status(200).send(sysStatus);
});


function gtfsDataUpdateCallback (err) {
    if (err) {
        eventCreator.emitGTFSFeedUpdateStatus({
            debug: 'Admin console received an error from the GTFS_FeedService.update callback.' ,
            timestamp : Date.now() ,
        });
    } else {
        eventCreator.emitGTFSFeedUpdateStatus({
            debug: 'Admin console received an "all-clear" from the GTFS_FeedService.update callback.' ,
            timestamp : Date.now() ,
        });
    }
}


module.exports = router;
