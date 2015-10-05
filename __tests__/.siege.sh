#https://unix.stackexchange.com/questions/85457/how-to-circumvent-too-many-open-files-in-debian
siege -b -c $1 -v -f './.urls.txt' 
