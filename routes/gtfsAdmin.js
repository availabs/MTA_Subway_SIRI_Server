'use strict';



    // Merge the static and hot config files.
var ConfigService = require('../src/services/ConfigsService') ,
    gtfsConfig    = ConfigService.getGTFSConfig() ,

    latestDataURL = gtfsConfig.latestDataURL ,

    gtfsFeed      = require('../src/services/GTFS_Feed') ;


var express  = require('express') ,
    router   = express.Router()   ;


//router.get('/GTFS_stats', function(req, res) {
    //res.send('TODO: Implement this.');
//});

 
router.post('/update', function(req, res) {
    var postBody = req.body,
        dataUrl  = postBody.url || latestDataURL; // ??? Case-sensitive ???

    if ( ! dataUrl ) {
        res.status(422).send('The url query parameter is required.');
        return;
    } 

    //TODO: Return 'processing', then have client poll for status.
    gtfsFeed.update(dataUrl, function (err, stdout, stderr) {
        res.status((err) ? 500 : 200);

        res.send( {
            err    : err    ,
            stdout : stdout ,
            stderr : stderr ,
        } );
    });
});


       
module.exports = router;
