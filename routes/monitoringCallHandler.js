'use strict';

var util = require('util');

var ConverterService = require('../src/services/ConverterService');

var router = require('express').Router();


function sendReponse (res, contentType, error, callResponse) {
    if (error) {
        //res.status(200);
        res.status(500);
        res.write(util.inspect(error));
        res.end();
        return;
    }

    res.writeHead(200, {
        //'Content-Length': callResponse.length,
        'Content-Length': callResponse.toString().length,
        'Content-Type'  : contentType,
    });

    res.write(callResponse);
    res.end();
}


router.get('/:monitoringCallType/:extension', function(req, res) {
    var monitoringCallType = req.params.monitoringCallType,
        extension   = req.params.extension,
        contentType = (extension === 'xml') ? 'application/xml' : 'application/json',
        callback    = sendReponse.bind(null, res, contentType);

    if ( (monitoringCallType === 'StopMonitoringResponse') && (! req.query.MonitoringRef )) {
        res.status(422).send('The MonitoringRef parameter is required.');
        return;
    }

    if (monitoringCallType === 'StopMonitoringResponse') {
        ConverterService.getStopMonitoringResponse(req.query, extension, callback);
    } else if (monitoringCallType === 'VehicleMonitoringResponse') {
        ConverterService.getVehicleMonitoringResponse(req.query, extension, callback);
    } else {
        res.status(500).send('Unrecognized monitoring call type.');
    }
});


module.exports = router;
