#!/bin/bash 

# If program is not already running, start it 
HOWMANY="$(ps aux | grep 'node telegrammo.js' | wc -l)" 
if [ "$HOWMANY" -lt 2 ] 
then 
    cd $PWD 
    node telegrammo.js "$@"
fi
