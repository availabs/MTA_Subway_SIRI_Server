'use strict';


var gtfsConfig = require('../config/GTFS_config')     ,
    gtfsFeed   = require('../src/services/GTFS_Feed') ;

var express  = require('express') ,
    router   = express.Router()   ;


//router.get('/GTFS_stats', function(req, res) {
    //res.send('TODO: Implement this.');
//});

 
router.post('/update', function(req, res) {
    var postBody = req.body,
        dataUrl  = postBody.url || gtfsConfig.latestDataURL; // ??? Case-sensitive ???


    if ( ! dataUrl ) {
        res.status(422).send('The url query parameter is required.');
        return;
    } 

    //FIXME: Need to extend time-out.
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

