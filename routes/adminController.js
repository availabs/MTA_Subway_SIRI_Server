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



function authChecker (key, req, res, f) {
    if (!key) {
        return res.status(403).send('Admin authorization key required.');
    }

    AuthorizationService.isAdminAuthorized(key, function (err, isAuthd) {
    
        if (err) {
            return res.status(500).send('An error occurred while attempting admin authorization.');
        } 

        if (isAuthd) {
            try {
                f();
            } catch (err) {
                console.error(err.stack || err);
                return res.status(500).send('An error occurred while processing the admin task.');
            }
        } else {
            return res.status(403).send('Admin authorization failed.');
        }
    });
}




router.post('/start/Converter', function (req, res) {
    
    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {
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
    });
});


router.post('/stop/Converter', function (req, res) {
    
    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {
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
    });
});



//================ Config GET endpoints ================\\

router.get('/get/Logging/config', function (req, res) {
    
    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {
        return res.send(ConfigsService.getLoggingHotConfig());
    });
});


router.get('/get/GTFS/config', function (req, res) {
    
    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(ConfigsService.getGTFSHotConfig());
    });
});


router.get('/get/GTFS-Realtime/config', function (req, res) {

    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(ConfigsService.getGTFSRealtimeHotConfig());
    });
});

router.get('/get/Converter/config', function (req, res) {

    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(ConfigsService.getConverterHotConfig());
    });
});

router.get('/get/GTFS-Realtime/currentTimestamp', function (req, res) {

    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(JSON.stringify(ConverterService.getCurrentGTFSRealtimeTimestamp()));
    });
});

router.get('/get/GTFS-Realtime/feed-reader/state', function (req, res) {

    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(util.inspect(GTFSRealtime_FeedService.getFeedReaderState()) + '\n');
    });
});


router.get('/get/server/memory-usage', function (req, res) {

    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(process.memoryUsage());
    });
});

router.get('/get/server/state', function (req, res) {

    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        return res.send(ConverterService.getState());
    });
});

//================ Config POST endpoints ================\\
 

router.post('/update/GTFS/config', function(req, res) {

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;


    authChecker(key, res, res, function () {
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


                        newConfig = buildNewConfig(req.body);


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
    });
});


router.post('/update/GTFS/data', function(req, res) {
    // TODO: Implement lock to ensure only one update at a time.

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;


    authChecker(key, res, res, function () {
        try {
            SystemStatusService.resetGTFSLastDataUpdateLog() ;

            eventCreator.emitGTFSDataUpdateStatus({
                info: 'Server received request to update the GTFS feed data.' ,
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            console.log("===== UPDATE GTFS Data =====");

            gtfsMulter(req, res, function (err) {
                var newConfig = {};
                    //keys,
                    //i;

                if (err) {

                    eventCreator.emitGTFSDataUpdateStatus({
                        error: 'Server encountered an error while updating the GTFS feed data.' ,
                        debug: (err.stack || err) ,
                        timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                    });
                    eventCreator.emitError({ error: err });

                    return res.status(500).send("Server error while updating the GTFS feed data.");

                } else {

                    newConfig = buildNewConfig(req.body);

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
    });
});


function finishGTFSrtUpdate (req, res) {
    // Convert all stringified numbers in the request body to floats.
    //var newConfig = {};

    var newConfig = buildNewConfig(req.body);

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
        
                desc = 'Server encountered an error while updating the GTFS-Realtime configuration:\n' + 
                        err.message ;
                    

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

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {

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
                    if (req.file && (req.file.filename !== oldConfig.protofileName) && (req.file.filename !== "gtfs-realtime.proto")) {
                        
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

    });
});


router.post('/update/Logging/config', function (req, res) {

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;


    authChecker(key, res, res, function () {
        try {
            var loggingHotConfig = ConfigsService.getLoggingHotConfig(),

                newConfig = buildNewConfig(req.body) ,
                
                updatedConfig = Object.keys(loggingHotConfig || {}).reduce(function (acc, key) {
                                    if (newConfig[key] === undefined) {
                                        acc[key] = false;
                                    } else {
                                        acc[key] = newConfig[key];
                                    }

                                    return acc;
                                }, {});

            updatedConfig.daysToKeepLogsBeforeDeleting = newConfig.daysToKeepLogsBeforeDeleting || 0;

            eventCreator.emitLoggingStatus({
                info: 'Server received request for Logging configuration update.' ,
                timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            ConfigsService.updateLoggingConfig(updatedConfig, function (err) {
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
    });
});


function buildNewConfig (body) {

    if (!body || (typeof body !== 'object')) {
        return {};
    }

    return Object.keys(body).reduce(function (acc, key) {
        if ((key !== 'key') && (key !== 'protofile')) {
            if ((typeof body[key] === 'boolean') || (typeof body[key] === 'number')) {
                acc[key] = body[key];
            } else if ((body[key] === 'on') || (body[key] === 'true')) {
                acc[key] = true;
            } else if (!isNaN(parseFloat(body[key]))){
                acc[key] = parseFloat(body[key]);
            } else if ((body[key] === 'off') || (body[key] === 'false')) {
                acc[key] = false;
            } else {
                acc[key] = body[key];
            }
        }
      
        return acc;
    }, {});
}

router.post('/update/Converter/config', function(req, res) {

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {

        var newConfig  = buildNewConfig(req.body);

        eventCreator.emitConverterServiceStatus({
            info: 'Server received request for Converter configuration update.' ,
            timestamp : (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });


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
    });
});



//TODO: Move the lastGTFSDataUpdateResults to the SystemStatusService
router.get('/get/system/status', function (req, res) {
    var key = req.query && req.query.key;

    authChecker(key, res, res, function () {
        var sysStatus = SystemStatusService.getSystemStatus() ;
        return res.status(200).send(sysStatus);
    });
});




router.post('/authentication/key/ban', function(req, res) {

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {
        if (req.body.bannedKey) {
            AuthorizationService.banKey(req.body.bannedKey) ;
            res.status(200).send({ success: 'The key is banned.' });
        } else {
            res.status(422).send({ 
                error: 'To ban a key, send a POST with a "bannedKey" field in the body.'
            });
        }
    });
});


router.post('/authentication/key/reinstate', function(req, res) {

    var key = (req.body && req.body.key) || (req.query && req.query.key) ;

    authChecker(key, res, res, function () {
        if (req.body.reinstatedKey) {
            AuthorizationService.reinstateKey(req.body.reinstatedKey) ;
            res.status(200).send({ success: 'The key is reinstated.' });
        } else {
            res.status(422).send({ 
                error: 'To reinstate a key, send a POST with a "reinstatedKey" field in the body.'
            });
        }
    });
});




function gtfsDataUpdateCallback (err) {

    // Without this hack, can only upload a gtfs.zip file once. No idea why, but this fixes it.
    gtfsMulterStorage = multer.diskStorage({
        destination : ConfigsService.getGTFSConfig().workDirPath,
        filename    : function (req, file, cb) {
            var feedDataZipFileName = ConfigsService.getGTFSConfig().feedDataZipFileName;
            cb(null, feedDataZipFileName);
        },
    });

    gtfsMulter = multer({ storage: gtfsMulterStorage }).single('zipfile');

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
