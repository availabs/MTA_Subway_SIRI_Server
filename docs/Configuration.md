#Configuration files.

1. `logging.json` is used for turning various logging capacities on or off.  Sample:

    ```javascript
    {
        "logIndexingStatistics":  true,
        "logDataAnomalies":       true,
        "logErrors":              true,
        "logTrainLocations":      true,
        "logTrainTrackingStats":  true,
        "logUnscheduledTrips":    true,
        "logNoSpatialDataTrips":  true,
        "logTrainTrackingErrors": true,
        "logMemoryUsage":         true,
        "logFeedReader":          false,
        
        "daysToKeepLogsBeforeDeleting" : 3
    }
    ```
2. `<feed name>.json` file is used to configure the GTFS & GTFS-Realtime feed handler for a transit feeds. The `config/` directory may contain many of these files, but only one can be active at any given time. The `config.json` (see below) file determines which is active. Sample:
    ```javascript
    {

        "gtfs": {

            "feedURL": "http://transitfeeds.com/p/mta/79/latest/download",
            "tripKeyMutator": [".{9}", ""]

        },

        "gtfsrt": {
            "feedURL": "http://datamine.mta.info/mta_esi.php?&key=<API Key Here>",
            "readInterval":  30,
            "retryInterval": 4,
            "maxNumRetries": 2,
            "protofileName": "nyct-subway.proto",
            "useLastStoptimeUpdateAsDestination": true,
            "fieldMutators": {
                "OriginRef": [".", "MTA_$&"],
                "DestinationRef": [".", "MTA_$&"],
                "StopPointRef": [".", "MTA_$&"]
            } 
        }
    }
    ```
    The above example contains a couple of fields that may require some explanation. 
    
    `gtfs.tripKeyMutator` is used to mutate the GTFS trips.txt `trip_id` for indexing. This may be required to link the GTFS data with the GTFS-Realtime data. The first string in the array is a regular expression used for matching a portion of the `trip_id`, and the second string replaces it. In this example, the first 9 characters of the `trip_id` are removed. If the GTFS and GTFS-Realtime `trip_id` are identical, this field is not required and can be omitted.

    `gtfsrt.protofileName` contains the filename of any `.proto` file that extends `gtfs-realtime.proto` to parse the GTFS-Realtime feed. Note, if the extension file's name is `gtfs-realtime.proto`, it will overwrite the base file provided by Google. If this file is uploaded via the administrative console, then this field will be updated automatically. If the administrator manually uploads the extension file to 'proto_files/', then this field must be manually updated in the `<feed name>.json` file. If no extension `.proto` file is required, this field can be omitted.

    `gtfsrt.useLastStoptimeUpdateAsDestination` is used to indicate whether the last entry in the GTFS-Realtime `trip_update.stop_time_update` array can be used as the destination. The purpose is to provide a destination for unscheduled trips. The assumption cannot be made in general as some feeds provide only the immediate next stop in the `stop_time_updates` array.

    `gtfsrt.fieldMutators` contains regular expressions for mutating the three specified fields in the SIRI output. As with the `gtfs.tripKeyMutator`, the first string in the array matches a portion of the field's value, the second part replaces the match. In these examples, the fields are prepended with 'MTA_'.

3. `converter.json` is used to indicate which `<feed name>` is active.
    ```
    {
        "activeFeed": "mta_subway"
    }
    ```
    `activeFeed` **must** match a name of `<feed name>.json`, described above. 
    
    NOTE: Changing `activeFeed`'s value may require updating the GTFS data. This can be done either through the admin console, of by `bin/updateGTFSData`.
