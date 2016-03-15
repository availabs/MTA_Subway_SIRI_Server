// Shot out: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4

'use strict';

// We need to make sure that the EventHandling Service is running.
require('./src/services/EventHandlingService.js') ;



var fs         = require('fs')          , 
    express    = require('express')     ,
    bodyParser = require('body-parser') ,
    morgan     = require('morgan')      ;

var app = express() ;

var router = express.Router(),
    port   = process.env.PORT || 16181;

require('toobusy-js').maxLag(200); //Set toobusy maximum lag (ms).

// fire up memwatch
//require('./src/services/MemoryMonitoringService');


// ROUTE HANDLERS
// =============================================================================
var adminController = require('./routes/adminController'),

    monitoringCallController = require('./routes/monitoringCallController');



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/logs/server-access.log', {flags: 'a'});

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));


// ROUTES 
// =============================================================================

router.get('/', function(req, res) {
    res.json( { 
        routes: { 
            '/api/siri/vehicle-monitoring.json' : 'The SIRI VehicleMonitoring ("SIRI VM") call '            +
                                    'allows the developer to request information about '      +
                                    'one, some, or all trains monitored by the '              +
                                    'NYCT Subway System.'                                     ,

            '/api/siri/stop-monitoring.json'    : 'The SIRI StopMonitoring ("SIRI SM") call allows the '    +
                                    'developer to request information about the vehicles '    +
                                    'serving a particular stop.'                              ,
        } 
    } );   
});

// REGISTER THE ROUTES -------------------------------
app.use('/', router);
app.use('/admin', adminController);

app.use('/api/siri', monitoringCallController);


// THE STATIC ADMIN CONSOLE FILE
app.use('/console', express.static('console'));


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
