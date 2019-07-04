<?php
/**
 * Created by PhpStorm.
 * User: matthias
 * Date: 14.11.18
 * Time: 13:37
 */

namespace Tadis;

use Phore\FileSystem\PhoreTempFile;
use Phore\Html\Elements\RawHtmlNode;
use Phore\Html\Fhtml\FHtml;
use Phore\HttpClient\Ex\PhoreHttpRequestException;
use Phore\HttpClient\Handler\PhoreHttpFileStream;
use Phore\HttpClient\PhoreHttpAsyncQueue;
use Phore\HttpClient\PhoreHttpResponse;
use Phore\MicroApp\Type\Request;
use Phore\MicroApp\Type\RouteParams;
use Phore\StatusPage\BasicAuthStatusPageApp;
use Phore\StatusPage\Mod\ModInterMicroServiceNavigaion;
use Phore\StatusPage\PageHandler\NaviButtonWithIcon;


require __DIR__ . "/../../vendor/autoload.php";


set_time_limit(600);

$app = new BasicAuthStatusPageApp("RockR", "/admin");
$app->theme->frameworks["highlightjs"] = true;

$app->addModule(new ModInterMicroServiceNavigaion("http://ulan.talpa-services.de/system_sitemap.json"));

$app->define("config", function () {
    return phore_file(CONF_FILE)->get_yaml();
});

$app->define("anaConfig", function (array $config, RouteParams $routeParams) {
    $analytics = $routeParams->get("analytic");
    return phore_pluck($analytics, $config, new \Exception("Analytics '$analytics' not defined"));
});

$app->allowUser("admin", ADMIN_PASS);

require __DIR__ . "/_mapApi.php";

$app->addPage("/admin/", function ($config) use ($app) {
    $analytics = array_keys($config);

    $tbl = phore_array_transform($analytics, function ($key, $value){
       return[
           fhtml(["p" => $value]),
           "n/a",
           [
               "a @role=button @class=btn btn-primary @title=start analysis @href=/admin/$value" => ["i @class=fas fa-eye" => null]
           ]
       ];
    });

    $e = pt()->card(
        "Overview of Analytics",
        pt("table-striped table-hover")->basic_table(
            ["Analytic", "Despription", ""],
            $tbl,
            ["","","@align=right"]
        )
    );
    return $e;

}, new NaviButtonWithIcon("Overview", "fas fa-home"));

$app->addPage("/admin/documentation", function () {
    $e = fhtml();
    $e[] = pt()->card(
        "Documentation",
        FHtml::MarkdownFile("/opt/README.md")
    );
    return $e;
}, new NaviButtonWithIcon("Documentation", "fas fa-question"));



$app->addPage("/admin/map", function(RouteParams $routeParams) use ($app) {
    $app->theme->footer[] = new RawHtmlNode(file_get_contents(__DIR__ . "/map.html"));
    return [];
}, new NaviButtonWithIcon("Map", "fa-map"));


$app->addPage("/admin/:analytic", function (RouteParams $routeParams) use ($app) {
    $analytic = $routeParams->get("analytic");
    return pt()->card(
        "analyse machine data with: $analytic",
        [
            "form @action=/admin/$analytic @method=POST" => [
                ["Von: ", "input @type=date @name=from " => null],
                ["Bis: ", "input @type=date @name=till" => null],
                ["TMID: ", "input @type=text @name=tmid" => null],
                ["button @type=submit" => "Start analysis"]
            ]
        ]
    );
});



$app->router->post("/admin/:analytic", function(RouteParams $routeParams, Request $request, $anaConfig) use ($app) {
    $from = strtotime($request->POST->get("from"));
    $till = strtotime($request->POST->get("till")) + 86400;
    $tmid = $request->POST->get("tmid");
    $analytic = $routeParams->get("analytic");

    $shiftTime = 3600;

    set_time_limit(86400);

    header('X-Accel-Buffering: no');
    header("Content-Type: text/plain");
    ob_implicit_flush(1);
    ob_end_flush(); // start with output directly on request

    phore_out("Starting analytics $analytic for maschine $tmid...");
    phore_out("Starting analytics $analytic for maschine $tmid...");

    for ($curFrom = $from; $curFrom < $till-$shiftTime; $curFrom += $shiftTime) {
        $curTill = $curFrom + $shiftTime;
        $args = ["analytic" => $analytic, "from" => $curFrom, "till" => $curTill, "tmid" => $tmid];

        phore_out("Running interval $curFrom - $curTill...");

        $response = phore_http_request("http://localhost/v1/{analytic}/push?from={from}&till={till}&tmid={tmid}", $args)->withPostData()->send(false);
        if ($response->isFailed()) {
            phore_out("ERROR: " . str_replace("\\n", "\n", phore_json_pretty_print($response->getBody())));
            phore_out("Aborted import!");
            exit;
        }
        phore_out("Success: "  . phore_json_pretty_print($response->getBody()));

    }
    phore_out("DONE! Analytics done. ");
    exit;
});




$app->serve();
