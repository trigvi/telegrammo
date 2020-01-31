#!/bin/bash 

# If program is not already running, start it 
HOWMANY="$(ps aux | grep 'node telegrammo.js' | grep -v 'grep' | wc -l)" 
if [ "$HOWMANY" -lt 1 ] 
then 
    cd $PWD 
    node telegrammo.js "$@"
fi
