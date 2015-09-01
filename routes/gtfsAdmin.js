'use strict';

// NOTE: This file is a work-in-progress.

// TODO: The indexers should take callbacks so that this api can offer a status update in the response.
//       Going to need an endpoint that returns the dataDir's metadata.json.
// 
//var GTFS_Toolkit = require('MTA_Subway_GTFS-Realtime_to_SIRI_Converter').MTA_Subway_GTFS_Toolkit,
    //config       = require('../config/GTFS-config');


/*jshint unused:false*/

var express = require('express'),
    router  = express.Router();



router.get('/', function(req, res) {
    // Give sub-routes and expected POST parameters.
    res.json({ 'msg' : "You've hit the GTFS Administration controller.", });
});


       
module.exports = router;


/* all of this belongs in a GTFS_Toolkit.DataUploader and GTFS_Toolkit.VersionHandler

router.post('/upload', function (req, res) {
    var url = req.body.url,

        dataRequest,
        dataFile;
        
    if ( ! url ) {
       res.status(400);
       res.send("You must specify the GTFS data's URL in the POST body via the 'url' property.");
       return;
    }
    
    dataFile    = fs.createWriteStream(config.gtfsDataDir + "gtfs.zip");
    dataRequest = http.get(url, function(response) {
                            response.pipe(dataFile);
                        });
});
 

*/
