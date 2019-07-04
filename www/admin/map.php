<?php
require __DIR__ . "/../../vendor/autoload.php";
require __DIR__ . "/ClusterAnalyzer.php";

$origFrom = strtotime("2019-01-06");
$days = 14;

ini_set("display_errors", 1);
ini_set("memory_limit", "512M");

$cache = new \Phore\Cache\Cache(new \Phore\ObjectStore\ObjectStore(new \Phore\ObjectStore\Driver\FileSystemObjectStoreDriver("/tmp/cache1")));

$tmid="undefined";

$analyzer = new ClusterAnalyzer(20000);
$from = $origFrom;
for ($curDay = 0; $curDay < $days; $curDay++) {
    $till = $from + 86400;

    phore_out("Pulling data: " . date("Y-m-d H:i:s", $from) . " - " . date("Y-m-d H:i:s", $till));
    $data = phore_http_request("http://flesto.talpa-services.de/v1/$tmid/influx")
        ->withCache($cache)
        ->withQueryParams(["q" => "SELECT * FROM motion_log_sec WHERE time >= {$from}s  AND time < {$till}s AND speed <0.01 "])
        ->send()->getBodyJson();

    $from += 86400;
    $lastTs = 0;
    $duration = 0;

    foreach ($data as $point) {
        //$analyzer->addPoint($point["gps_lat"], $point["gps_long"]);
        //continue;
        if ($point["ts"] <= $lastTs+2) {
           // echo ".";
            $duration++;
        } else {
            if ($duration > 1) {
                $analyzer->addPoint($point["gps_lat"], $point["gps_long"]);
                //echo "d$duration.";
            }
            $duration = 0;
        }
        $lastTs = $point["ts"];
    }
}

phore_out("blur");

$analyzer->blur();

phore_out("calculate");

$analyzer->calculatePoints(0);
//$analyzer->dump();

phore_out("start calculation");
$analyzer->calculate();
phore_out("end calc");

echo "\n-----------------------------\n";
$analyzer->dump();
echo "\n-----------------------------\n";
//print_r ($analyzer->getNextPolynom());
//exit;
$analyzer->calculateGeofences();

$from = $origFrom;
for ($curDay = 0; $curDay < $days; $curDay++) {
    $till = $from + 86400;

    phore_out("Pulling data: " . date("Y-m-d H:i:s", $from) . " - " . date("Y-m-d H:i:s", $till));
    $data = phore_http_request("http://flesto.talpa-services.de/v1/$tmid/influx")
        ->withCache($cache)
        ->withQueryParams(["q" => "SELECT * FROM motion_log_sec WHERE time >= {$from}s  AND time < {$till}s AND speed <0.01 "])
        ->send()->getBodyJson();

    $from += 86400;
    $lastTs = 0;
    $duration = 0;

    $lastFence = null;
    foreach ($data as $point) {

        $fence = $analyzer->getGeoFenceByCoord($point["gps_lat"], $point["gps_long"]);
        if ($fence === null)
            continue;

        if ($lastFence === $fence) {
            continue;
        }
        $fence->increment("enter");
        $lastFence = $fence;

    }
}


?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Heatmaps</title>
    <style>
        /* Always set the map height explicitly to define the size of the div
         * element that contains the map. */
        #map {
            height: 100%;
        }
        /* Optional: Makes the sample page fill the window. */
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        #floating-panel {
            position: absolute;
            top: 10px;
            left: 25%;
            z-index: 5;
            background-color: #fff;
            padding: 5px;
            border: 1px solid #999;
            text-align: center;
            font-family: 'Roboto','sans-serif';
            line-height: 30px;
            padding-left: 10px;
        }
        #floating-panel {
            background-color: #fff;
            border: 1px solid #999;
            left: 25%;
            padding: 5px;
            position: absolute;
            top: 10px;
            z-index: 5;
        }
    </style>
</head>

<body>
<div id="floating-panel">
    <button onclick="toggleHeatmap()">Toggle Heatmap</button>
    <button onclick="changeGradient()">Change gradient</button>
    <button onclick="changeRadius()">Change radius</button>
    <button onclick="changeOpacity()">Change opacity</button>
</div>
<div id="map"></div>
<script>

    // This example requires the Visualization library. Include the libraries=visualization
    // parameter when you first load the API. For example:
    // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization">

    var map, heatmap;

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 17,
            center: {lat: 51.3275, lng: 8.3878},
            mapTypeId: 'satellite'
        });

        var addListenersOnPolygon = function(polygon) {
            google.maps.event.addListener(polygon, 'click', function (event) {
                alert(polygon.info);
            });
        };

        <?php

        $colorArr = [
            "FF0000", "#7DFDFE", "#728C00", "#FFFF00", "#C88141", "#FF0000", "#7D0541", "#C12267", "#C6AEC7"
        ];

        $i = 0;
        foreach ($analyzer->getGeoFences() as $geoFence) {
            $data = [];
            foreach ($geoFence->points as $cur) {
                $data[] = ["lat" => $cur[0], "lng" => $cur[1]];
            }
            $i++;
            $color = $colorArr[$i % count($colorArr)];
            echo "curPoly = new google.maps.Polygon({paths:" . json_encode($data) . ", strokeColor: '$color',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '$color',
                  info: '{$geoFence->getInfo()}',
                  fillOpacity: 0.35, map: map});
                  addListenersOnPolygon(curPoly);";

            //if ($i == 3)
            //    break;

        }


        ?>
        heatmap = new google.maps.visualization.HeatmapLayer({
            data: getPoints(),
            radius: 40,
            map: map
        });
    }

    function toggleHeatmap() {
        heatmap.setMap(heatmap.getMap() ? null : map);
    }

    function changeGradient() {
        var gradient = [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
        ]
        heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
    }

    function changeRadius() {
        heatmap.set('radius', heatmap.get('radius') ? null : 150);
    }

    function changeOpacity() {
        heatmap.set('opacity', heatmap.get('opacity') ? null : 0.2);
    }

    // Heatmap data: 500 Points
    function getPoints() {
        return [
            //new google.maps.LatLng(37.782551, -122.445368),

            <?php


            foreach ($analyzer->getDistribution() as $point) {
                //for ($i=0; $i<$point[2]; $i++)
                echo "new google.maps.LatLng({$point[0]}, {$point[1]}),";
            }



            ?>


        ];
    }
</script>
<script async defer
        src="https://maps.googleapis.com/maps/api/js?key=&libraries=visualization&callback=initMap">
</script>
</body>
</html>

<?php

phore_out("end");
