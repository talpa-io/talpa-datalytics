<?php
/**
 * Created by PhpStorm.
 * User: matthias
 * Date: 29.04.19
 * Time: 14:41
 */
namespace App;

use Phore\Cache\Cache;
use Phore\MicroApp\Handler\JsonResponseHandler;
use Phore\MicroApp\Type\Request;

require __DIR__ . "/ClusterAnalyzer.php";


/**
 * @var $app \Phore\StatusPage\StatusPageApp
 */

require __DIR__ . "/FlestoAnalyzer.php";

$app->define("cache", function () : Cache {
    return new \Phore\Cache\Cache(new \Phore\ObjectStore\ObjectStore(new \Phore\ObjectStore\Driver\FileSystemObjectStoreDriver("/tmp/cache1")));
});



$app->router->get("/admin/map/loadGf", function (Request $request, Cache $cache) use ($app) {
    $app->setResponseHandler(new JsonResponseHandler());

    ini_set("display_errors", 1);
    ini_set("memory_limit", "512M");
    $from = strtotime($request->GET->get("from", "-30 days"));
    $tmid = $request->GET->get("tmid");
    $days = $request->GET->get("days", 1);
    $query = $request->GET->get("query", "");
    $color = $request->GET->get("color", "#FF0000");

    $loader = new FlestoConnector($cache);
    $loader->fillData($from, $days, $tmid, $query);

    return $loader->getGeoFences($color);
});


$app->router->get("/admin/map/drive", function (Request $request, Cache $cache) use ($app) {
    $app->setResponseHandler(new JsonResponseHandler());

    ini_set("display_errors", 1);
    ini_set("memory_limit", "512M");

    $from = strtotime($request->GET->get("from", "-30 days"));
    $tmid = $request->GET->get("tmid");
    $days = $request->GET->get("days", 1);
    $sampleInterval = $request->GET->get("sampleInterval");
    #$color = $request->GET->get("color", "#FF0000");

    $loader = new FlestoConnector($cache);
    return $loader->getDrivePositions($from, $days, $tmid, $sampleInterval);
});
