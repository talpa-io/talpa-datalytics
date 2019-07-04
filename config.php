<?php
/**
 * This file is copied to config.php by kick
 *
 * Placeholders (\%CONF_ENVNAME\%) are being replaced by the values found in environment.
 * See .kick.yml config_file section.
 *
 * Original file by kickstart-skel/php-app-base
 */

define("DEV_MODE", (bool)"1");
define("VERSION_INFO", "v0.1.354 (20190703-175429)");

define("CONF_FILE",  "/opt/analytics/analytics.yml");

if (DEV_MODE === true) {
    define("ADMIN_PASS", "");

} else {
    // PRODUCTION SETTINGS
    define("ADMIN_PASS", "%ADMIN_PASS%");
}
