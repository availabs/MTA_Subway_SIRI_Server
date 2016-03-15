'use strict';


var path = require('path') ;

var ConfigsService = require('../../src/services/ConfigsService') ;


var configGetterPattern = /^get.*Config$/ ,
    addListenerPattern  = /^add.*Listener$/ ,
    removeListenerPattern = /^remove.*Listener/ ,

    logFilePathPattern = /^.*LogPath$/ ;


var listeners    = [] ,
    interceptors = [] ;

var mockLogsDir = path.join(__dirname, './logs/');


function redirectLogs (config) {
    if (config && (typeof config === 'object')) {
        return Object.keys(config).reduce(function (acc, key) {
            if (logFilePathPattern.test(key)) {
                var basename = path.basename(config[key]) ;
                acc[key] = path.join(mockLogsDir, basename);
            } else {
                acc[key] = config[key];
            }

            return acc ;
        }, {});
    } else {
        return config ;
    }
}

var mockConfigService = Object.keys(ConfigsService).reduce(function (acc, key) {
    var i;

    switch (true) {
    case configGetterPattern.test(key) :
        // Replace the config getter with one that redirects the log output.
        acc[key] = function () { return redirectLogs(ConfigsService[key]()); } ;
//acc[key] = function () { var conf = redirectLogs(ConfigsService[key]()); console.log(conf); return conf; } ;
        break ;

    case addListenerPattern.test(key) :
        acc[key] = function (listener) { 
            i = (listeners.push(listener) - 1) ; //Index of the newly added listener;

            // Create an interceptor for the listener
            // and push it to the interceptors list.
            interceptors.push(function (config) { listener(redirectLogs(config)); });
            
            // Add the interceptor as a listener in the ConfigsService.
            ConfigsService[key](interceptors[i]); 
        } ;
        break ;

    case removeListenerPattern.test(key) :
        acc[key] = function (listener) {
            // If we have wrapped the listener with an interceptor,
            // remove the listener and interceptor from their list,
            // and remove the interceptor from the ConfigService listeners.
            if ((i = listeners.indexOf(listener)) > -1) {
                listeners.splice(i, 1);
                ConfigsService[key](interceptors.splice(i,1));
            }
        };
        break ;

    default :
        acc[key] = ConfigsService[key] ;
        break ;
    }

    return acc;
}, {});


module.exports = mockConfigService ;
