# talpa-datalytics
Datalytics test base container

## SIGTERM Trap
The container will catch SIGTERM signal and will gracefully shutdown if the webserver is idle or non-responsive

Steps executed when a SIGTERM signal is received

- Get the server status from the route /server-status
- Check the http response status code
    - if status code is not 200, terminate the container immediately(Web Server is already not responding)
- else (status code is 200), check in the http response body for requests being processed
    - if no requests are pending kill the container 
    - else sleep 2 seconds and start the steps from the beginning and will continue until the container is terminated with a SIGKILL signal
 
