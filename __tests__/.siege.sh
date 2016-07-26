#https://unix.stackexchange.com/questions/85457/how-to-circumvent-too-many-open-files-in-debian
#siege -c $1 -b -v -f './.urls.txt' 
siege -c $1 -v -f './.urls.txt' -i
