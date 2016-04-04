(function () {
    'use strict';

    /* globals $ */

    var systemStatus , 
        gtfsConfig ,
        gtfsrtConfig ,
        loggingConfig ;

    var activeConfigDiv = '#ServerStatus';

    $("#ServerStatus_selector").addClass('active');
    $("#FeedConfig_div").hide();
    $("#LoggingConfig_div").hide();

    var messageLevels = {
      'danger'  : 0,
      'warning' : 1,
      'success' : 2,
      'info'    : 3,
      undefined : 4,
    };

    var componentShortToLongNameMap = {
        system: 'System',
        'logging': 'Logging',
        'gtfs': 'GTFS Feed Handler',
        'gtfsrt': 'GTFS-Realtime Feed Reader',
        'converter': 'GTFS-Realtime to Siri Converter',
    } ;

    var systemStatusPollTimeout = 5000;

    var statusDetailPanelComponent ,
        statusDetailPanelStatusField;

    //http://stackoverflow.com/a/901144
    function getParameterByName(name, url) {
        if (!url) { url = window.location.href; }

        // This is just to avoid case sensitiveness  
        url = url.toLowerCase(); 

        // This is just to avoid case sensitiveness for query parameter name
        name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);

        if (!results) { return null; }
        if (!results[2]) { return ''; }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    var key = getParameterByName('key');
    

    (function () {
        var descriptionDivs = [
                "GTFS_feedURL_div",
                "GTFS_zipfile_div",
                "GTFS_reset_config_btn_div",
                "GTFS_update_config_btn_div",
                "GTFS_update_data_btn_div",
                "GTFS-Realtime_feedURL_div",
                "GTFS-Realtime_readInterval_div",
                "GTFS-Realtime_retryInterval_div",
                "GTFS-Realtime_maxNumRetries_div",
                "GTFS-Realtime_protofile_div",
                "GTFS-Realtime_reset_config_btn_div",
                "GTFS-Realtime_update_config_btn_div",

                "Logging_logIndexingStatistics_div",
                "Logging_logErrors_div",
                "Logging_logTrainLocations_div",
                "Logging_logTrainTrackingStats_div",
                "Logging_logUnscheduledTrips_div",
                "Logging_logNoSpatialDataTrips_div",
                "Logging_logTrainTrackingErrors_div",
                "Logging_daysToKeepLogsBeforeDeleting_div",
            ] ,
            
            i ; 


        function fadeIn  (divID) { 
            $('#' + divID).show() ; 
        }
        function fadeOut (divID) { 
            $('#' + divID).hide(); 
        }

        for ( i = 0; i < descriptionDivs.length; ++i) {
            var id = descriptionDivs[i];
            $('#' + id).hover(
                fadeIn.bind(null, id.replace('div', 'description')) ,
                fadeOut.bind(null, id.replace('div', 'description')) 
            ); 
        }
    }());
    

    function notify(pane, message, alertLevel) {
        alertLevel = alertLevel || 'info';

        $('#' + pane + '_notifications_div').prepend(
                '<div class="alert alert-' + alertLevel + '">' +
                    '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + 
                    message + '<br/>Go to the SystemHealth pane for more details.' + 
                '</div>');
    }

    function switchActiveConfigDiv (newActiveDivSelector) {

        $(activeConfigDiv + '_selector').removeClass('active');
        $(newActiveDivSelector + '_selector').addClass('active');

        $(activeConfigDiv + '_div').hide();
        $(activeConfigDiv + '_div').hide();
        $(newActiveDivSelector + '_div').show();

        activeConfigDiv = newActiveDivSelector;
    }

    $("#ServerStatus_selector").bind('click', switchActiveConfigDiv.bind(null, '#ServerStatus'));
    $("#FeedConfig_selector").bind('click', switchActiveConfigDiv.bind(null, '#FeedConfig'));
    $("#LoggingConfig_selector").bind('click', switchActiveConfigDiv.bind(null, '#LoggingConfig'));




    function setGTFSFormPlaceholders () {
        var keys = Object.keys(gtfsConfig) ,
            i ;

        for ( i = 0; i < keys.length; ++i ) {
            $('#GTFS_' + keys[i] + '_input').prop('defaultValue', gtfsConfig[keys[i]]);
        }
    }

    function setGTFSrtFormPlaceholders () {
        var keys = Object.keys(gtfsrtConfig) ,
            i ;

        for ( i = 0; i < keys.length; ++i ) {
            $('#GTFS-Realtime_' + keys[i] + '_input').prop('defaultValue', gtfsrtConfig[keys[i]]);
        }
    }

    function setLoggingFormPlaceholders () {
        var keys = Object.keys(loggingConfig) ,
            switchPattern = /^log/,
            i ;

        for ( i = 0; i < keys.length; ++i ) {
            if (keys[i].match(switchPattern)) {
                $('#Logging_' + keys[i] + '_input').bootstrapToggle(loggingConfig[keys[i]] ? 'on' : 'off');
            } else {
                $('#Logging_' + keys[i] + '_input').prop('defaultValue', loggingConfig[keys[i]]);
            }
        }
    }



    function removeGTFSDataFile () {
        $("#GTFS_data_file").replaceWith($("#GTFS_data_file").clone(true));
        $('#remove_GTFS_data_file_btn').remove();
        $('#update_GTFS_config_btn').removeClass('disabled');
    }

    function appendRemoveGTFSDataFileButton () {
        $('#GTFS_form_btn_row').append(
                '<button id="remove_GTFS_data_file_btn" class="btn btn-primary btn-sm">' +
                'Remove GTFS Data File' +
                '</button>'
        );
        $('#remove_GTFS_data_file_btn').on('click', removeGTFSDataFile);
    }
    
    $('#GTFS_data_file').change(function () {
        var fileName  = $("#GTFS_data_file").val(),
            extension = fileName.substr((~-fileName.lastIndexOf(".") >>> 0) + 2);

        if (extension !== 'zip') {
            $('#GTFS_form').append(
                '<div class="alert alert-danger">' +
                    '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + 
                    "GTFS feed data file uploads must be in a .zip archive." + 
                '</div>');
           
            // Remove the file from the form if it is not a .zip archive.
            removeGTFSDataFile();
        } else {
            appendRemoveGTFSDataFileButton();
            $('#update_GTFS_config_btn').addClass('disabled');
        }
    });


    $('#update_GTFS_config_btn').bind('click', function () {
        sendGTFSUpdatePost('/admin/update/GTFS/config?key=' + key);
        return false;
    });

    $('#update_GTFS_data_btn').bind('click', function () {
        sendGTFSUpdatePost('/admin/update/GTFS/data?key=' + key);
        return false;
    });



    function sendGTFSUpdatePost (url) {

        var formData = new FormData($("#GTFS_form")[0]);

        $.ajax({
            type    : "POST",
            url     : url,
            error   : function(xhr) { 
                notify('GTFS-Realtime', xhr.responseText, 'danger'); 
            },
            success : function(response) { 
                notify('GTFS', response, 'success'); 
            },
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });

        return false;
    }


    $('#GTFS-Realtime_update_config_btn').bind('click', function () {

        var formData = new FormData($("#GTFS-Realtime_form")[0]);

        $.ajax({
            type    : "POST",
            url     : '/admin/update/GTFS-Realtime/config?key=' + key ,
            error   : function(xhr) { 
                notify('GTFS-Realtime', xhr.responseText, 'danger'); 
            },
            success : function(response) { 
                notify('GTFS-Realtime', response, 'success'); 
            },
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });

        return false;
    });



    $('#Logging_update_config_btn').bind('click', function () {
        var data = $('#Logging_form').serializeArray()
                                           .reduce(function (acc, pair) {
                                                acc[pair.name] = pair.value;
                                                return acc;
                                           }, { key: key });
        $.ajax({
            type    : "POST",
            data    : data ,
            url     : '/admin/update/Logging/config' ,
            error   : function(xhr) { 
                notify('GTFS-Realtime', xhr.responseText, 'danger'); 
            },
            success : function(response) { 
                notify('GTFS-Realtime', response, 'success'); 
            },
        });

        return false;
    });



    function formatStatusContent (content) {
        if (!(content && (typeof content === 'object'))) { return content; }

        var dataRows = [] ,
            entry,
            i;

        function buildAlert (msg) {
            var alertMessage ;

            if (!msg) { 
                alertMessage = '' ;
            } else if ((entry = msg.error)) {
                alertMessage = '<div class="alert alert-danger minimal" role="alert">' ;
            } else if ((entry = msg.warning)) {
                alertMessage = '<div class="alert alert-warning minimal" role="alert">' ;
            } else if ((entry = msg.info)) {
                alertMessage = '<div class="alert alert-success minimal" role="alert">' ;
            } 

           if (entry && entry.replace) {
               alertMessage += entry.replace('\n', '<br/>')
                                    .replace(' ', '&nbsp;')
                                    .replace('\"', '"') + '</div>' ;
           }

           return alertMessage;
        }

        if (Array.isArray(content)) {
            for ( i = 0; i < content.length; ++i ) {
              dataRows.push(buildAlert(content[i]));
            }
        } else {
            var keys = Object.keys(content).sort();

            for ( i = 0; i < keys.length; ++i ) {
                dataRows.push(buildAlert(content[keys[i]]));
            }
        }

        return dataRows.join('');
    }

    function fillStatusDetailPanel (component, statusField) {
        if (component) {
            statusDetailPanelComponent = component;
        }
        if (statusField) {
            statusDetailPanelStatusField = statusField;
        } else if (!(statusDetailPanelComponent && statusDetailPanelStatusField)) {
            return;
        }

        $('#ServerStatus_detailed_content_title_div').html(
                componentShortToLongNameMap[statusDetailPanelComponent] +  
                ((statusDetailPanelStatusField === 'configStatus')?' Configuration Validation Output':' Status Log')
        );
        $('#ServerStatus_detailed_content_div').html(
                formatStatusContent(systemStatus[statusDetailPanelComponent][statusDetailPanelStatusField])
        );
    }

    function loadSystemStatusData (data) {
      var components = Object.keys(data),

          componentData,

          configStatus,
          configStatusElement,
          configStatusHasError,
          configStatusWarningCount,
          configStatusMessageLevel,

          configStatus_div,
          configStatus_content,

          statusLog,
          statusLogEntry,
          statusLogHasError,
          statusLogWarningCount,
          statusLogMessageLevel,

          statusLog_div,
          statusLog_content,

          keys,
          i, j, k ;


      // For each monitored system component.
      for ( i = 0; i < components.length; ++i ) {


        componentData = data[components[i]];


        //======================= Component Configuration Status =======================
        configStatus  = componentData.configStatus;

        configStatus_div     = $('#SystemStatus_' + components[i] + '_configStatus_div');
        configStatus_content = $('#SystemStatus_' + components[i] + '_configStatus_content');

        configStatus_div.hover(fillStatusDetailPanel.bind(null, components[i], 'configStatus'));

        configStatusHasError = false;
        configStatusWarningCount = 0;

        if (configStatus) {
            keys = Object.keys(configStatus);

            for ( j = 0; j < keys.length; ++j ) {
                configStatusElement = configStatus[keys[j]];

                if ((configStatusElement) && (typeof configStatusElement === 'object')) {
                    if (configStatusElement.error) { 
                        configStatusHasError = true;
                        break; 
                    }

                    if (configStatusElement.warning) {
                        ++configStatusWarningCount;
                    }
                }
            }

            if (configStatusHasError) {
                configStatus_content.html('Failed validation tests.');
                configStatusMessageLevel = 'danger';
            } else if (configStatusWarningCount) {
                configStatus_div.html(
                    'Passed with ' + configStatusWarningCount + 
                    ' warning' + ((configStatusWarningCount === 1) ? '.' : 's.')
                );
                configStatusMessageLevel = 'warning';
            } else {
                configStatus_content.html('Passed all validation tests.');
                configStatusMessageLevel = 'success';
            }


        } else {
            configStatusMessageLevel = 'info';
            configStatus_content.html('No validation info available.');
        }


        configStatus_div.removeClass('panel-danger') 
                        .removeClass('panel-warning') 
                        .removeClass('panel-success') 
                        .removeClass('panel-info') ;

        configStatus_div.addClass('panel-' + configStatusMessageLevel);


        //======================= Status Log Summary =======================
        statusLog = componentData.statusLog;

        statusLog_div     = $('#SystemStatus_' + components[i] + '_statusLog_div');
        statusLog_content = $('#SystemStatus_' + components[i] + '_statusLog_content');

        statusLog_div.hover(fillStatusDetailPanel.bind(null, components[i], 'statusLog'));

        statusLogHasError = false;
        statusLogWarningCount = 0;

        if (Array.isArray(statusLog)) {

            if (statusLog.length) {
                for ( j = 0; j < statusLog.length; ++j ) {
                    statusLogEntry = statusLog[j];

                    if (typeof statusLogEntry === 'object') {
                        keys = Object.keys(statusLogEntry);

                        for ( k = 0; k < keys.length; ++k ) {
                            if (keys[k] === 'error') {
                                statusLogHasError = true;
                                break;
                            }

                            if (keys[k] === 'warning') {
                                ++statusLogWarningCount;
                            }
                        }

                        if (statusLogHasError) { break; }
                    }
                }

                if (statusLogHasError) {
                    statusLog_content.html('Contains errors.');
                    statusLogMessageLevel = 'danger';

                } else if (statusLogWarningCount) {
                    statusLog_content.html(
                        'Contains ' + statusLogWarningCount + 
                        ' warning' + ((statusLogWarningCount === 1) ? '.' : 's.')
                    );
                    statusLogMessageLevel = 'warning';

                } else {
                    statusLog_content.html('Contains no errors or warnings.');
                    statusLogMessageLevel = 'success' ;
                }
            } else {
                statusLog_content.html('Contains no entries.');
                statusLogMessageLevel = 'info' ;
            }
        } else {
            statusLog_content.html('No log available.');
            statusLogMessageLevel = 'info' ;
        }

        statusLog_div.removeClass('panel-danger') 
                     .removeClass('panel-warning') 
                     .removeClass('panel-success') 
                     .removeClass('panel-info') ;

        statusLog_div.addClass('panel-' + statusLogMessageLevel);


        $('#SystemStatus_' + components[i] + '_div').removeClass('panel-danger') 
                                                    .removeClass('panel-warning') 
                                                    .removeClass('panel-success') 
                                                    .removeClass('panel-info') ;


        if (!(configStatusMessageLevel || statusLogMessageLevel)) {
            $('#SystemStatus_' + components[i] + '_div').addClass('panel-info') ;
        } else if (messageLevels[configStatusMessageLevel] < messageLevels[statusLogMessageLevel]) {
            $('#SystemStatus_' + components[i] + '_div').addClass('panel-' + configStatusMessageLevel) ;
        } else {
            $('#SystemStatus_' + components[i] + '_div').addClass('panel-' + statusLogMessageLevel) ;
        }

      } // End for-loop over monitored components


      if (data.converter && data.converter.isRunning) {
          setConverterButtonToStop();
      } else {
          var startButtonEnabled;
          try {
              startButtonEnabled = (data.system.configStatus.__isValid && 
                                    data.gtfs.configStatus.__isValid && 
                                    data.gtfsrt.configStatus.__isValid && 
                                    data.converter.configStatus.__isValid ) ;

          } catch (e) {
              setConverterButtonToStart(false);
          } finally {
              setConverterButtonToStart(startButtonEnabled);
          }
      } 
    } // End loadSystemStatusData

    function setConverterButtonToStart (startButtonEnabled) {

        // reset 
        $('#Converter_start_btn').unbind('click', sendConverterStartPost);
        $('#Converter_start_btn').unbind('click', sendConverterStopPost);

        $('#Converter_start_btn').removeClass('btn-danger');

        $('#Converter_start_btn').bind('click', sendConverterStartPost);
        $('#Converter_start_btn').html('Start the Converter');
        $('#Converter_start_btn').addClass('btn-success');
        $('#Converter_start_btn').html('Start the Converter');
      
        if (startButtonEnabled) {
            $('#Converter_start_btn').prop('disabled', false);
            $('#Converter_start_btn').removeClass('disabled');
            $('#Converter_start_btn_div').hover(function () {
                $('#ServerStatus_detailed_content_title_div').html('Start the Converter.');
                $('#ServerStatus_detailed_content_div').html('The Converter is currently not running.');
            });
        } else {
            $('#Converter_start_btn_div').hover(function () {
                $('#ServerStatus_detailed_content_title_div').html('Converter Start button is disabled.');
                $('#ServerStatus_detailed_content_div').html(
                    "The the System, GTFS, GTFS-Realtime, and Converter configuration files " +
                    "must all be valid to start the Converter."
                );
            });
            $('#Converter_start_btn').prop('disabled', true);
            $('#Converter_start_btn').addClass('disabled');
        }
    }

    function setConverterButtonToStop () {
        
        // reset 
        $('#Converter_start_btn').unbind('click', sendConverterStartPost);
        $('#Converter_start_btn').unbind('click', sendConverterStopPost);

        $('#Converter_start_btn').removeClass('btn-success');

        $('#Converter_start_btn').bind('click', sendConverterStopPost);
        $('#Converter_start_btn').prop('disabled', false);
        $('#Converter_start_btn').html('Stop the Converter');
        $('#Converter_start_btn').removeClass('disabled');
        $('#Converter_start_btn').addClass('btn-danger');
        $('#Converter_start_btn_div').hover(function () {
            $('#ServerStatus_detailed_content_title_div').html('Stop the Converter.');
            $('#ServerStatus_detailed_content_div').html('The Converter is currently running.');
        });
    }

    function sendConverterStartPost() {
        $.ajax({
            type    : "POST",
            url     : '/admin/start/Converter',
            data    : { key : key } ,
            //error   : function(xhr)      { notify('GTFS', xhr.responseText, 'danger'); },
            success : setConverterButtonToStop,
        });
    }

    function sendConverterStopPost() {
        $.ajax({
            type    : "POST",
            url     : '/admin/stop/Converter',
            data    : { key : key } ,
            //error   : function(xhr)      { notify('GTFS', xhr.responseText, 'danger'); },
            success : setConverterButtonToStart.bind(null, true),
        });
    }



    (function pollSystemStatus () {
         $.ajax({
             url: '/admin/get/system/status/?key=' + key,
             dataType : 'json',
             success: function(data) {
                fillStatusDetailPanel();
                systemStatus = data;
                loadSystemStatusData(data);
             },
            complete: setTimeout(function () { pollSystemStatus(); }, systemStatusPollTimeout),
            timeout: 2000
         });
    }());

     $.ajax({
         url: '/admin/get/GTFS/config/?key=' + key,
         dataType : 'json',
         success: function(data) {
            gtfsConfig = data;
            setGTFSFormPlaceholders();
         }
     });
     $.ajax({
         url: '/admin/get/GTFS-Realtime/config/?key=' + key,
         dataType : 'json',
         success: function(data) {
            gtfsrtConfig = data;
            setGTFSrtFormPlaceholders();
         }
     });
     $.ajax({
         url: '/admin/get/Logging/config/?key=' + key,
         dataType : 'json',
         success: function(data) {
            loggingConfig = data;
            setLoggingFormPlaceholders();
         }
     });

}());
