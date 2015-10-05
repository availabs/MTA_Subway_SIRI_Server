#curl localhost:16180/vehicle-monitoring | jq '.' > response.sample.json
curl "localhost:16180/vehicle-monitoring/?VehicleMonitoringDetailLevel=calls" > response.sample.json
