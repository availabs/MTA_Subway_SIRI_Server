#https://unix.stackexchange.com/questions/85457/how-to-circumvent-too-many-open-files-in-debian
siege -c $1 -v  http://localhost:16180/vehicle-monitoring
