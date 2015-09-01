'use strict';

//var fs = require('fs');

var ConverterService = require('../src/services/ConverterService');


var express = require('express'),
    router  = express.Router();


router.get('/', function(req, res) {
    var smr;

    if ( ! req.query.MonitoringRef ) {
        res.status(422).send('The MonitoringRef parameter is required.');
        return;
    }

    try {
        smr = ConverterService.getStopMonitoringResponse(req.query);
        res.json(smr);
    } catch (e) { 
         res.status(500)
            .send((process.env === 'development') ?  e.stack : 'Error while serving request.');
    }
});


module.exports = router;
