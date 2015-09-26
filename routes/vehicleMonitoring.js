'use strict';

//var fs = require('fs');

var ConverterService = require('../src/services/ConverterService');


var express = require('express'),
    router  = express.Router();


router.get('/', function(req, res) {
    var smr;

    try {
        smr = ConverterService.getVehicleMonitoringResponse(req.query);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(smr);
    } catch (e) { 
         res.status(500)
            //.send((process.env === 'development') ?  e.stack : 'Error while serving request.');
            .send(e.stack);
    }
});


module.exports = router;
