'use strict';

//var fs = require('fs');

var ConverterService = require('../src/services/ConverterService');


var express = require('express'),
    router  = express.Router();


router.get('/', function(req, res) {
    var smr;

    try {
        smr = ConverterService.getVehicleMonitoringResponse(req.query);
        res.send(smr);
    } catch (e) { 
        console.log(e.stack);
         res.status(500)
            //.send((process.env === 'development') ?  e.stack : 'Error while serving request.');
            .send(e.stack);
    }
});


module.exports = router;
