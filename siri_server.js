// Shot out: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4

'use strict';



var express    = require('express')     ,
    bodyParser = require('body-parser') ;


//The following two are for the server access log.
//var fs         = require('fs')          , 
    //morgan     = require('morgan')      ;


// We need to make sure that the EventHandling Service is running.
// If is not required by any other modules, so we need to require it
// here to make sure the code that it contains is executed.
require('./src/services/EventHandlingService.js') ;


var serverConfig = require('./src/services/ConfigsService').getServerConfig() ;


var app = express() ;

var router = express.Router(),
    port   = process.env.PORT || (serverConfig && serverConfig.defaultPortNumber) || 16181;

require('toobusy-js').maxLag(200); //Set toobusy maximum lag (ms).



// ROUTE HANDLERS
// =============================================================================
var adminController = require('./routes/adminController'),

    monitoringCallController = require('./routes/monitoringCallController');



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// create a write stream (in append mode)
//var accessLogStream = fs.createWriteStream(__dirname + '/logs/server-access.log', {flags: 'a'});

// setup the logger
//app.use(morgan('combined', {stream: accessLogStream}));


// ROUTES 
// =============================================================================

router.get('/', function(req, res) {
    res.json( { 
        routes: { 
            '/api/siri/vehicle-monitoring.json' : 'The SIRI VehicleMonitoring ("SIRI VM") call ' +
                                    'allows the developer to request information about ' +
                                    'one, some, or all trains monitored by the ' +
                                    'NYCT Subway System.' ,

            '/api/siri/stop-monitoring.json' : 'The SIRI StopMonitoring ("SIRI SM") call allows the ' +
                                    'developer to request information about the vehicles ' +
                                    'serving a particular stop.' ,
        } 
    } );   
});

// REGISTER THE ROUTES -------------------------------
app.use('/', router);
app.use('/admin', adminController);

app.use('/api/siri', monitoringCallController);

//THE STATIC ADMIN CONSOLE FILE
app.use('/console', express.static('console')) ;

//var staticMiddleware = express.static("console/");

//app.use('/console', function (req, res, next) { 
    ////var key = req.query && req.query.key ;

    ////if (key && require('./src/services/AuthorizationService').isAdminAuthorized(key)) {
        //return staticMiddleware(req, res, next);
    ////} else {
        ////return res.status(401).send('Admin authorization key required.');
    ////}
 //});


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('The server is listening on port ' + port);
