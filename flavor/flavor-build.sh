#!/bin/bash

#
# This file is called from Kickstart to
# finalize the container installation
#

set -e

apt-get update
apt-get install -y apache2 libapache2-mod-php7.2 composer php7.2-curl php-xml php-zip php-mbstring php-yaml php-json php-http python3-venv libpq-dev postgresql-common gcc cmake

cp /datalytics/000-default.conf /etc/apache2/sites-available/000-default.conf

chown -R user:user /datalytics
cd /datalytics
sudo -u user composer update

echo export APACHE_RUN_USER=user >> /etc/apache2/envvars

KICK_YML_FILE=/datalytics/.kick.yml sudo -E -s -u user kick build

