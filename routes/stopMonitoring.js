'use strict';

//var fs = require('fs');

var ConverterService = require('../src/services/ConverterService');


var express = require('express'),
    router  = express.Router();


router.get('/', function(req, res) {
    var latestConverter,
        smr;

    if ( ! req.query.MonitoringRef ) {
        res.status(422).send('The MonitoringRef parameter is required.');
        return;
    }

    console.log(req.query.MonitoringRef);

    try {
        latestConverter = ConverterService.getLatestConverter();

        //fs.writeFile('DEBUG.out', JSON.stringify(latestConverter.GTFSrt, null, '    '));

        smr = latestConverter.getStopMonitoringResponse(req.query);
        smr.timestamper.stamp();



        res.json(smr.response);
    } catch (e) { 
         res.status(500)
            .send((process.env === 'development') ?  e.stack : 'Error while serving request.');
    }
});




module.exports = router;
