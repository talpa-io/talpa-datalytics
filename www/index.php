<?php

namespace App;
use Phore\MicroApp\App;
use Phore\MicroApp\Auth\HttpBasicAuthMech;
use Phore\MicroApp\Exception\AuthRequiredException;
use Phore\MicroApp\Handler\JsonExceptionHandler;
use Phore\MicroApp\Handler\JsonResponseHandler;
use Phore\MicroApp\Type\Request;
use Phore\MicroApp\Type\RouteParams;

require __DIR__ . "/../vendor/autoload.php";

$app = new App();
$app->activateExceptionErrorHandlers();
$app->setOnExceptionHandler(new JsonExceptionHandler());
$app->setResponseHandler(new JsonResponseHandler());

$app->assets()->addAssetSearchPath(__DIR__ . "/asset/");


set_time_limit(800);
/**
 ** Functions
 **/

function authenicate($tmid, $machineConfig)
{
    $mech = new HttpBasicAuthMech();
    if (Request::Build()->remoteAddr == "127.0.0.1" && $mech->getAuthToken() == "local_mode")
        return true;
    if (($hash = phore_pluck(["auth_basic"], $machineConfig, null)) !== null) {
        if ( ! password_verify($mech->getAuthPasswd(), $hash)) {
            header ("WWW-Authenticate: Basic realm=\"TaDiS\"");
            throw new AuthRequiredException("Unauthorized for machine '$tmid'.", 401);
        }
    }
}

/**
 ** Configure Access Control Lists
 **/
$app->acl->addRule(\aclRule()->route("/*")->ALLOW());


/**
 ** Configure Dependency Injection
 **/
$app->define("config", function () {
    return phore_file(CONF_FILE)->get_yaml();
});

$app->define("anaConf", function (array $config, RouteParams $routeParams) {
    $analytics = $routeParams->get("analytics");
    return phore_pluck($analytics, $config, new \Exception("Analytics '$analytics' not defined"));
});


$app->router->onGet("/", function (App $app)  {
    return ["success" => true, "msg" => "talpa datalytics ready", "gmdate" => gmdate("Y-m-d H:i:s"), "version" => VERSION_INFO, "host" => gethostname()];
});




/**
 ** Define Routes
 **/

$app->router->on("/v1/:analytics/push", ["GET", "POST"], function (Request $request, string $analytics, array $anaConf) use ($app) {

    $params = [
        "type" => "push",
        "analytics_name" => $analytics
    ];

    foreach ($request->GET->list() as $name) {
        $params[$name] = $request->GET->get($name);
    }

    $cwd = phore_file(CONF_FILE)->withDirName()->withRelativePath(phore_pluck("cwd", $anaConf, ""));
    $push = phore_pluck("push", $anaConf, new \Exception("No push service defined for '$analytics'"));

    chdir($cwd);

    if ( ! is_array($push))
        $push = [$push];

    putenv("LANGUAGE=en_US.UTF-8");
    putenv("LANG=en_US.UTF-8");
    putenv("VIRTUAL_ENV=/opt/venv");
    putenv("PATH=/opt/venv/bin:".getenv("PATH"));


    $output = "";
    foreach ($push as $curCmd) {
        $output .= "\n\n==> OUTPUT FROM: $curCmd\n";
        $output .= phore_exec($curCmd, [
            "params" => json_encode($params)
        ]);
    }

    return ["success" => true, "debug_output" => $output, "executed" => $push];
});


$app->router->onGet("/v1/:analytics", function (Request $request, string $analytics, array $anaConf) {
    $tmids = $request->GET->get("tmids", null);
    $debug = (string)$request->GET->get("debug", 0);

    $params = [
        "tmids" => explode(";", $tmids),
        "type" => "pull",
        "analytics_name" => $analytics,
        "debug" => $debug
    ];
    foreach ($request->GET->list() as $name) {
        if (in_array($name, ["tmids"])) {
            continue; // Ignore raw TMIDs parameter
        }
        $params[$name] = $request->GET->get($name);
    }


    $cwd = phore_file(CONF_FILE)->withDirName()->withRelativePath(phore_pluck("cwd", $anaConf, ""));
    $pull = phore_pluck("pull", $anaConf, new \Exception("No pull service defined for '$analytics'"));
    chdir($cwd);

    $output = phore_proc($pull, [
        "params" => json_encode($params)
    ], $cwd, ["LANGUAGE=en_US.UTF-8", "LANG=en_US.UTF-8", "VIRTUAL_ENV=/opt/venv", "PATH=/opt/venv/bin:".getenv("PATH")])->wait();

    $data = json_decode($output->getSTDOUTContents(), true);
    if (! is_array($data))
        throw new \InvalidArgumentException("command did not output valid json '{$output->getSTDOUTContents()}'");
    if ($debug) {
        $data["_debug"] = explode("\n", $output->getSTDERRContents());
    }
    return $data;

});


/**
 ** Run the application
 **/
$app->serve();
