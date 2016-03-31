'use strict';

var toobusy = require('toobusy-js');

var ConverterService = require('../src/services/ConverterService') ,
    AuthorizationService = require('../src/services/AuthorizationService') ,

    router = require('express').Router() ,

    toobusyErrorMessage = "Server is temporarily too busy. Please try again.";



function sendResponse (res, contentType, statusCode, error, callResponse) {
    if (error) {
        return res.status(500).send({ error: "Server error occurred while processing the response." });
    }

    res.writeHead(statusCode, {
        'Content-Length': callResponse.toString().length,
        'Content-Type'  : contentType,
    });

    return res.end(callResponse);
}


// Hand-off the requests.
// NOTE: Because of the extensions on the routes, we need to use res.redirect.
router.get('/stop-monitoring.json', function (req, res) {
    handleRequest(req, res, 'stopMonitoring', 'json');
});

router.get('/stop-monitoring.xml', function (req, res) {
    handleRequest(req, res, 'stopMonitoring', 'xml');
});

router.get('/vehicle-monitoring.json', function (req, res) {
    handleRequest(req, res, 'vehicleMonitoring', 'json');
});

router.get('/vehicle-monitoring.xml', function (req, res) {
    handleRequest(req, res, 'vehicleMonitoring', 'xml');
});


function handleRequest (req, res, monitoringCallType, dataFormat) {
    var contentType = (dataFormat === 'xml') ? 'application/xml' : 'application/json',
        callback    = sendResponse.bind(null, res, contentType),

        caseInsensitiveQuery = {},

        qParam, value,
        queryParams,

        i;


    var apiKey = req.query && req.query.key;


    if ((monitoringCallType !== 'stopMonitoring')&&(monitoringCallType !== 'vehicleMonitoring')) {
        return res.status(404).send('The resource you requested could not be found.');
    }


    if (!ConverterService.isRunning()) {
        return res.status(503).send({error : 'Converter service is not running.' });
    }
    

    if (toobusy()) {
        return ConverterService.getErrorResponse(toobusyErrorMessage, 
                                                 monitoringCallType, 
                                                 dataFormat, 
                                                 callback.bind(null, 503));
    }

    if (!apiKey) {
        return ConverterService.getErrorResponse("API key required.",
                                                 monitoringCallType, 
                                                 dataFormat, 
                                                 callback.bind(null, 403));
    }


    AuthorizationService.isAuthorized(apiKey, function (err, isAuthd) {


        if (err) {
            return ConverterService.getErrorResponse('An error occurred during authorization.',
                                                     monitoringCallType, 
                                                     dataFormat, 
                                                     callback.bind(null, 403));
        }


        if (!isAuthd) {
            return ConverterService.getErrorResponse('API key is not authorized or rate exceeded.',
                                                     monitoringCallType, 
                                                     dataFormat, 
                                                     callback.bind(null, 403));
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


        if (monitoringCallType === 'stopMonitoring') {
            try {
                ConverterService.getStopMonitoringResponse(caseInsensitiveQuery, 
                                                           dataFormat, 
                                                           callback.bind(null, 200));
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
        } else {
            try {
                ConverterService.getVehicleMonitoringResponse(caseInsensitiveQuery, 
                                                              dataFormat, 
                                                              callback.bind(null, 200));
            } catch (e) {
                if ( ! res.headersSent ) {
                    return res.status(500).send({error : "Internal server error." });
                }
                console.error(e.stack);
            }
        }
    });
}


module.exports = router;
