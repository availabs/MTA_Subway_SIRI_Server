set -e;

# kill off subshells if parent script 
#trap "kill -- -$BASHPID" SIGINT  SIGTERM  EXIT

for i in `seq 1 100`;
do
    (while true; do curl localhost:16180/vehicle-monitoring > /dev/null; done;) &
done
