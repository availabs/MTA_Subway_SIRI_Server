set -e 

sudo apt-get update
sudo apt-get -y upgrade 
sudo apt-get install -y npm git

sudo npm install -g n
sudo n 0.10.35

mkdir -p code
cd code
git clone https://github.com/availabs/MTA_Subway_SIRI_Server.git

cd MTA_Subway_SIRI_Server
sudo npm install --production
./bin/updateGTFSData.js
