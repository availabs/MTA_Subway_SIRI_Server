'use strict';



var fs      = require('fs'),
    express = require('express') ,
    multer  = require('multer')  ,
    router  = express.Router()   ,
    util    = require('util')    ,
    rmdir   = require('rmdir')   ;

    // Merge the static and hot config files.
var ConverterService   = require('../src/services/ConverterService') ,
    ConfigsService     = require('../src/services/ConfigsService') ,

    GTFS_Feed          = require('../src/feeds/GTFS_Feed') ,
    GTFSRealtime_Feed  = require('../src/feeds/GTFS-Realtime_Feed'),

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


var lastGTFSDataUpdateResults = null;


//================ Config GET endpoints ================\\

router.get('/get/GTFS/config', function (req, res) {
    res.send(ConfigsService.getGTFSHotConfig());
});

router.get('/get/GTFS-Realtime/config', function (req, res) {
    res.send(ConfigsService.getGTFSRealtimeHotConfig());
});

router.get('/get/GTFS-Realtime_to_SIRI_Converter/config', function (req, res) {
    res.send(ConfigsService.getConverterHotConfig());
});

router.get('/get/GTFS-Realtime/currentTimestamp', function (req, res) {
    res.send(JSON.stringify(ConverterService.getCurrentGTFSRealtimeTimestamp()));
});

router.get('/get/GTFS-Realtime/feed-reader/state', function (req, res) {
    res.send(util.inspect(GTFSRealtime_Feed.getState()) + '\n');
});

router.get('/get/GTFS-Realtime/feed-reader/timestampOfLastSuccessfulRead', function (req, res) {
    res.send(GTFSRealtime_Feed.getTimestampOfLastSuccessfulRead());
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

    try {
        gtfsMulter(req, res, function (err) {
            var gtfsConfig,
                errorMessage;

            if (err) {
                console.log(err.stack);
                res.status(500).send(err);
            } else {
                if (req.file) {
                    errorMessage = "GTFS data updates must use the /admin/update/GTFS/data route.\n" +
                                   "All configuration changes sent with the file will be discarded.\n";

                    gtfsConfig = ConfigsService.getGTFSConfig();

                    console.error("ERROR: Non-null file send to admin/update/GTFS/config");

                    rmdir(gtfsConfig.tmpDirPath, function (err) {
                        if (err) {
                            errorMessage += 
                                    "\n\tAn error occurred while attempting to delete the uploaded file." + err;
                        } else {
                            errorMessage += "\n\tThe uploaded file was deleted.";
                        } 
                        res.status(500).send({ error: errorMessage });
                    }); 
                } else {
                    ConfigsService.updateGTFSConfig(req.body, function (err) {
                        if (err) {
                            res.status(500).send({ 
                                error: "An error occurred while updating the GTFS configuration:\n" + err,
                            });
                        } else {
                            res.status(200).send("GTFS configuration update successful.\n" +
                                                 "Changes will take place immediately.");
                        }
                    });
                }
            }
        });
    } catch (e) {
        res.status(500).send({ error: e });
    }
});


router.post('/update/GTFS/data', function(req, res) {
    // TODO: Implement lock to ensure only one update at a time.
    try {
        console.log("===== UPDATE GTFS Data =====");

        gtfsMulter(req, res, function (err) {
            var newConfig = {},
                keys,
                i;

            if (err) {
                console.log(err.stack);
                res.status(500).send({ error: err });
            } else {
                keys = Object.keys(req.body);

                for ( i = 0; i < keys.length; ++i ) {
                    if (keys[i] !== 'zipfile') {
                        newConfig[keys[i]] = req.body[keys[i]];
                    } 
                }

                ConfigsService.updateGTFSConfig(newConfig, function (err) {
                    if (err) {
                        console.error("ERROR: /admin/update/GTFS/data:\n" + err.stack);
                        res.status(500).send({ error: err });
                    } else {
                        GTFS_Feed.update((req.file) ? "file" : "url", gtfsDataUpdateCallback);
                        
                        // Immediate response. Client should poll for status updates.
                        res.status(200).send("GTFS update process successfully started.");
                    }
                });
            }
        });
    } catch (e) {
        console.error("ERROR: /admin/update/GTFS/data:\n" + e.stack);
        res.status(500).send({ error: e.stack });
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
            console.log(err);
            res.status(500).send({ error: err.message });
        } else {
            res.status(200);
            res.send('Update successful.');
        }
    });
}


router.post('/update/GTFS-Realtime/config', function (req, res) {
    var oldConfig = ConfigsService.getGTFSRealtimeConfig();

    try {
        gtfsrtMulter(req, res, function (err) {
            if (err) {
                console.log(err.stack);
                res.status(500).send({ error: err });
            } else {
                // Was the protofile renamed? If so, we delete the old one.
                if (req.file && (req.file.filename !== oldConfig.protofileName)) {
                    
                    // Remove the old protofile
                    fs.access(oldConfig.protofileName, fs.W_OK, function (err) {
                        if (err) {
                            // Previous protofile cannot be deleted.
                           finishGTFSrtUpdate(req, res); 
                        } else {
                            fs.unlink(oldConfig.protofilePath, function (err) {
                                if (err) {
                                   res.status(500).send({ error: err });
                                } else {
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
    } catch (e) {
        res.status(500).send({ error: e });
    }
});





router.post('/update/GTFS-Realtime_to_SIRI_Converter/config', function(req, res) {
    var newConfig  = {},
        configKeys = ((req.body !== null) && (typeof req.body === 'object')) && Object.keys(req.body),
        onOffKey,
        i;

    for ( i = 0; i < configKeys.length; ++i ) {
        onOffKey = configKeys[i].replace('LoggingLevel', '');
        onOffKey = 'log' + onOffKey[0].toUpperCase() + onOffKey.slice(1);

        newConfig[configKeys[i]] = req.body[configKeys[i]];
        newConfig[onOffKey]      = (req.body[configKeys[i]] !== 'off');
    }

    ConfigsService.updateConverterConfig(newConfig, function (err) {
        if (err) {
            res.status(500).send({ error: err });
        } else {
            res.status(200);
            res.send('Update successful.');
        }
    });
});


router.get('/get/GTFS/lastUpdateStatus', function (req, res) {
    res.send(lastGTFSDataUpdateResults);
});


function gtfsDataUpdateCallback (err) {
    lastGTFSDataUpdateResults = {
        status : (!err) ? 'Succeeded' : 'Failed',
    };

    if (err) {
        lastGTFSDataUpdateResults.err = err.stack || err;
    }

    console.log(lastGTFSDataUpdateResults);
}


module.exports = router;
