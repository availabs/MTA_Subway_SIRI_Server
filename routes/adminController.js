'use strict';



var express = require('express') ,
    router  = express.Router()   ,
    util    = require('util')    ;

    // Merge the static and hot config files.
var ConverterService  = require('../src/services/ConverterService') ,
    ConfigsService    = require('../src/services/ConfigsService') ,
    GTFSRealtime_Feed = require('../src/services/GTFS-Realtime_Feed'),
    gtfsConfig        = ConfigsService.getGTFSConfig() ,

    latestDataURL = gtfsConfig.latestDataURL ,

    gtfsFeed      = require('../src/services/GTFS_Feed') ;


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

router.get('/get/GTFS-Realtime/feed-reader/lastReadTimestamp', function (req, res) {
    res.send(GTFSRealtime_Feed.getLastReadTimestamp().toString());
});

router.get('/get/server/memory-usage', function (req, res) {
    res.send(process.memoryUsage());
});

//================ Config POST endpoints ================\\
 
router.post('/update/GTFS/config', function(req, res) {
    var newConfig = req.body;

    console.log(req);

    //TODO: Return 'processing', then have client poll for status.
    ConfigsService.updateGTFSConfig(newConfig, function (err) {
        if (err) {
            res.status(500);
            res.send(err);
        } else {

            res.status(200);
            res.send('Update successful.');
        }
    });
});


router.post('/update/GTFS-Realtime/config', function(req, res) {
    var newConfig = {};

    Object.keys(req.body).reduce(function (acc, key) {
        if (! isNaN(req.body[key])) {
           acc[key] = parseFloat(req.body[key]); 
        } else {
            acc[key] = req.body[key];
        }

        return acc;
    }, newConfig);


    //TODO: Return 'processing', then have client poll for status.
    ConfigsService.updateGTFSRealtimeConfig(newConfig, function (err) {
        if (err) {
            res.status(500);
            res.send(err);
        } else {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            res.status(200);
            res.send('Update successful.');
        }
    });
});


router.post('/update/GTFS-Realtime_to_SIRI_Converter/config', function(req, res) {
    var newConfig = {};
    
    Object.keys(req.body).reduce(function (acc, key) {
        if ((req.body[key] === true) || (req.body[key] === 'true')) {
           acc[key] = true; 
        } else {
            acc[key] = false;
        }

        return acc;
    }, newConfig);


    //TODO: Return 'processing', then have client poll for status.
    ConfigsService.updateConverterConfig(newConfig, function (err) {
        if (err) {
            res.status(500);
            res.send(err);
        } else {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            res.status(200);
            res.send('Update successful.');
        }
    });
});


//================ Data update endpoints ================\\

router.post('/update/GTFS/data', function(req, res) {
    var postBody = req.body,
        dataUrl  = postBody.url || latestDataURL; // ??? Case-sensitive ???

    if (lastGTFSDataUpdateResults && (lastGTFSDataUpdateResults.status === 'Processing')) {
        res.status(500);
        res.send('GTFS data update already in progress.');
        return;
    }

    try {
        gtfsFeed.update(dataUrl, gtfsDataUpdateCallback);

        lastGTFSDataUpdateResults = {
            'status' : 'Processing' ,
        };

        res.status(202);
        res.send('Processing. Poll /get/GTFS/lastUpdateStatus for results.');
    } catch (e) {
        res.status(500);
        res.send(e);
    }
});


router.get('/get/GTFS/lastUpdateStatus', function (req, res) {
    res.send(lastGTFSDataUpdateResults);
});


function gtfsDataUpdateCallback (err, stdout, stderr) {
    lastGTFSDataUpdateResults = {
        status : (!err) ? 'Succeeded' : 'Failed',
        err    : err    ,
        stdout : stdout ,
        stderr : stderr ,
    };
}


module.exports = router;
