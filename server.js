// Shot out: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4

'use strict';

var fs         = require('fs')          , 
    express    = require('express')     ,
    app        = express()              ,
    morgan     = require('morgan')      ,
    bodyParser = require('body-parser') ;

var router = express.Router(),
    port   = process.env.PORT || 16180;

// init winston logging
require('./src/logging/initWinston');

// fire up memwatch
require('./src/services/MemoryMonitoringService');


// ROUTE HANDLERS
// =============================================================================
var admin        = require('./routes/admin'),

    vehicleMonitoring = require('./routes/vehicleMonitoring'),
    stopMonitoring    = require('./routes/stopMonitoring');



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
            '/admin'              : 'Administrative functionality.'                           ,

            '/vehicle-monitoring' : 'The SIRI VehicleMonitoring ("SIRI VM") call '            +
                                    'allows the developer to request information about '      +
                                    'one, some, or all trains monitored by the '              +
                                    'NYCT Subway System.'                                     ,

            '/stop-monitoring'    : 'The SIRI StopMonitoring ("SIRI SM") call allows the '    +
                                    'developer to request information about the vehicles '    +
                                    'serving a particular stop.'                              ,
        } 
    } );   
});


// more routes for our API will happen here


// REGISTER THE ROUTES -------------------------------
app.use('/', router);
app.use('/admin', admin);
app.use('/vehicle-monitoring', vehicleMonitoring);
app.use('/stop-monitoring', stopMonitoring);

// THE STATIC ADMIN CONSOLE FILE

app.use('/console', express.static('console'));


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
