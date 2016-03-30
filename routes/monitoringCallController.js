'use strict';

var toobusy = require('toobusy-js');

var ConfigsService = require('../src/services/ConfigsService') ,
    ConverterService = require('../src/services/ConverterService') ,
    AuthorizationService = require('../src/services/AuthorizationService') ,

    serverConfig = ConfigsService.getServerConfig() ,
    router = require('express').Router() ,

    toobusyErrorMessage = "Server is temporarily too busy. Please try again.";



function sendResponse (res, contentType, error, callResponse) {
    if (error) {
        return res.status(500).send({ error: "Server error occurred while processing the response." });
    }

    res.writeHead(200, {
        'Content-Length': callResponse.toString().length,
        'Content-Type'  : contentType,
    });

    return res.end(callResponse);
}


// Hand-off the requests.
// NOTE: Because of the extensions on the routes, we need to use res.redirect.
router.get('/stop-monitoring.json', function (req, res) {
    handleRequest(req, res, 'StopMonitoringResponse', 'json');
});

router.get('/stop-monitoring.xml', function (req, res) {
    handleRequest(req, res, 'StopMonitoringResponse', 'xml');
});

router.get('/vehicle-monitoring.json', function (req, res) {
    handleRequest(req, res, 'VehicleMonitoringResponse', 'json');
});

router.get('/vehicle-monitoring.xml', function (req, res) {
    handleRequest(req, res, 'VehicleMonitoringResponse', 'xml');
});


function handleRequest (req, res, monitoringCallType, extension) {
    var contentType = (extension === 'xml') ? 'application/xml' : 'application/json',
        callback    = sendResponse.bind(null, res, contentType),

        caseInsensitiveQuery = {},

        qParam, value,
        queryParams,
        i;


    var apiKey = req.query && req.query.key;

    if (apiKey && AuthorizationService.isAuthorized(apiKey)) {
        if (!ConverterService.isRunning()) {
            return res.status(503).send({error : 'Converter service is not running.' });
        } else if (toobusy()) {
            return res.status(503).send({error : toobusyErrorMessage });
        }
    } else {
        var host = (serverConfig.registrationURL || req.protocol + '://' + req.get('host'));

        return res.status(403).send('Admin authorization apiKey required. ' + 
                                    ' Vist ' + host + '/register to get a apiKey.');
    }


    if ((req.query !== null) && (typeof req.query === 'object')) {
        queryParams = Object.keys(req.query);

        for ( i = 0; i < queryParams.length; ++i ) {
            qParam   = (queryParams[i].toLowerCase) ?
                        queryParams[i].toLowerCase() : queryParams[i];
            value = (req.query[queryParams[i]].toLowerCase) ? 
                        req.query[queryParams[i]].toLowerCase() : req.query[queryParams[i]];

            caseInsensitiveQuery[qParam] = value;
            caseInsensitiveQuery['_' + qParam] = req.query[queryParams[i]];
        }

    } else {
        caseInsensitiveQuery = req.query;
    }


    if (monitoringCallType === 'StopMonitoringResponse') {
        try {
            ConverterService.getStopMonitoringResponse(caseInsensitiveQuery, extension, callback);
        } catch (e) {
            if ( ! res.headersSent ) {
                return res.status(500).send({error : "Internal server error." });
            }
            try {
                res.end();
                console.error(e.stack);
            } catch (e2) {
                console.error(e.stack);
                console.error(e2.stack);
            }
        }
    } else if (monitoringCallType === 'VehicleMonitoringResponse') {
        try {
            ConverterService.getVehicleMonitoringResponse(caseInsensitiveQuery, extension, callback);
        } catch (e) {
            if ( ! res.headersSent ) {
                return res.status(500).send({error : "Internal server error." });
            }
            console.error(e.stack);
        }
    } else {
        return res.status(500).send({ error: 'Unrecognized monitoring call type.'});
    }
}


module.exports = router;
