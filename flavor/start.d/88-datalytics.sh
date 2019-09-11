#!/bin/bash

## File is executed as root - change to user


KICK_YML_FILE=/datalytics/.kick.yml sudo -E -s -u user kick write_config_file
KICK_YML_FILE=/datalytics/.kick.yml sudo -E -s -u user kick init

KICK_YML_FILE=/opt/.kick.yml

service apache2 start