set -e;

while true; do
    curl localhost:16180/vehicle-monitoring | \
            jq '.Siri.ServiceDelivery.SituationExchangeDelivery' >> \
            situations.sample.json;
    sleep 30;
done;
