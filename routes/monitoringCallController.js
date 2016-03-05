'use strict';

var util    = require('util'),
    toobusy = require('toobusy-js');

var ConverterService = require('../src/services/ConverterService');

var router = require('express').Router();

var toobusyErrorMessage = "Server is temporarily too busy. Please try again.";

function sendReponse (res, contentType, error, callResponse) {
    if (error) {
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

    res.end(callResponse);
}


// Hand-off the requests.
// NOTE: Because of the extensions on the routes, we need to use res.redirect.
router.get('/stop-monitoring.json', function (req, res) {
    if (toobusy()) {
        res.status(503).send({error : toobusyErrorMessage });
    } else {
        handleRequest(req, res, 'StopMonitoringResponse', 'json');
   } 
});

router.get('/stop-monitoring.xml', function (req, res) {
    if (toobusy()) {
        res.status(503).send({error : toobusyErrorMessage });
    } else {
        handleRequest(req, res, 'StopMonitoringResponse', 'xml');
    }
});

router.get('/vehicle-monitoring.json', function (req, res) {
    if (toobusy()) {
        res.status(503).send({error : toobusyErrorMessage });
    } else {
        handleRequest(req, res, 'VehicleMonitoringResponse', 'json');
    }
});

router.get('/vehicle-monitoring.xml', function (req, res) {
    if (toobusy()) {
        res.status(503).send({error : toobusyErrorMessage });
    } else {
        handleRequest(req, res, 'VehicleMonitoringResponse', 'xml');
    }
});


function handleRequest (req, res, monitoringCallType, extension) {
    var contentType = (extension === 'xml') ? 'application/xml' : 'application/json',
        callback    = sendReponse.bind(null, res, contentType),

        caseInsensitiveQuery = {},

        key, value,
        queryKeys,
        i;

    if ((req.query !== null) && (typeof req.query === 'object')) {
        queryKeys = Object.keys(req.query);

        for ( i = 0; i < queryKeys.length; ++i ) {
            key   = (queryKeys[i].toLowerCase) ?
                        queryKeys[i].toLowerCase() : queryKeys[i];
            value = (req.query[queryKeys[i]].toLowerCase) ? 
                        req.query[queryKeys[i]].toLowerCase() : req.query[queryKeys[i]];

            caseInsensitiveQuery[key] = value;
            caseInsensitiveQuery['_' + key] = req.query[queryKeys[i]];
        }

    } else {
        caseInsensitiveQuery = req.query;
    }

    if ( (monitoringCallType === 'StopMonitoringResponse') && (! caseInsensitiveQuery.monitoringref )) {
        res.status(422).send('The MonitoringRef parameter is required.');
        return;
    }

    if (monitoringCallType === 'StopMonitoringResponse') {
        try {
            ConverterService.getStopMonitoringResponse(caseInsensitiveQuery, extension, callback);
        } catch (e) {
            if ( ! res.headersSent ) {
                res.status(500).send({error : "Internal server error." });
            }
            console.error(e.stack);
        }
    } else if (monitoringCallType === 'VehicleMonitoringResponse') {
        try {
            ConverterService.getVehicleMonitoringResponse(caseInsensitiveQuery, extension, callback);
        } catch (e) {
            if ( ! res.headersSent ) {
                res.status(500).send({error : "Internal server error." });
            }
            console.error(e.stack);
        }
    } else {
        res.status(500).send('Unrecognized monitoring call type.');
    }
}


module.exports = router;
