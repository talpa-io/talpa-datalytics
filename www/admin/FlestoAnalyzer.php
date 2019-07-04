<?php
/**
 * Created by PhpStorm.
 * User: matthias
 * Date: 29.04.19
 * Time: 17:03
 */

namespace App;


use Phore\Cache\Cache;

class FlestoConnector
{
    /**
     * @var \ClusterAnalyzer
     */
    public $ca;

    /**
     * @var Cache
     */
    public $cache;

    public function __construct(Cache $cache)
    {
        $this->ca = new \ClusterAnalyzer(10000);
        $this->cache = $cache;
    }


    public function queryFlesto(string $tmid, string $query) : array
    {
        $data = phore_http_request("http://flesto.talpa-services.de/v1/{tmid}/influx", ["tmid"=> $tmid])
            ->withCache($this->cache)
            ->withQueryParams(["q" => $query])
            ->send()->getBodyJson();
        return $data;
    }



    public function fillData (int $from, int $days, string $tmid, string $addQuery)
    {

        for ($i=0; $i<$days; $i++) {
            $cFrom = $from + $i * 86400;
            $cTill = $cFrom + 86400;
            $query = "SELECT * FROM motion_log_sec WHERE time >= {$cFrom}s  AND time < {$cTill}s {$addQuery}";
            foreach ($this->queryFlesto($tmid, $query) as $curRow) {
                $this->ca->addPoint($curRow["gps_lat"], $curRow["gps_long"]);
            }
        }

        $this->ca->blur();
        $this->ca->calculatePoints(0);
        $this->ca->calculate();
        $this->ca->calculateGeofences();

        $lastGf = null;
        for ($i=0; $i<$days; $i++) {
            $cFrom = $from + $i * 86400;
            $cTill = $cFrom + 86400;
            $query = "SELECT * FROM motion_log_sec WHERE time >= {$cFrom}s  AND time < {$cTill}s {$addQuery}";
            foreach ($this->queryFlesto($tmid, $query) as $curRow) {
                $gf = $this->ca->getGeoFenceByCoord($curRow["gps_lat"], $curRow["gps_long"]);
                if ($lastGf !== $gf) {
                    $gf->increment("enter");
                    $lastGf = $gf;
                }
            }
        }
    }


    public function getGeoFences(string $color = "#FF0000") : array
    {
        $data = [];
        foreach ($this->ca->getGeoFences() as $curGf) {
            $ret = [
                "paths" => [],
                "info" => $curGf->getInfo(),
                "color" => $color
            ];
            foreach ($curGf->points as $cur)
                $ret["paths"][] = ["lat" => $cur[0], "lng" => $cur[1]];
            $data[] = $ret;
        }
        return $data;
    }

    public function getDrivePositions (int $from, int $days, string $tmid, int $sampleInterval)
    {
        $ret = [];

        #$interval = 10000 / ($days * 86400);
        $mod = (int)$sampleInterval;

        for ($i = 0; $i < $days; $i++) {
            $cFrom = $from + $i * 86400;
            $cTill = $cFrom + 86400;
            $query = "SELECT * FROM motion_log_sec WHERE time >= {$cFrom}s  AND time < {$cTill}s";
            foreach ($this->queryFlesto($tmid, $query) as $curRow) {
                if ($curRow["ts"] % $mod === 0) {
                    $ret[] = ["ts"=>gmdate("Y-m-d H:i:s", $curRow["ts"]), "lat"=> $curRow["gps_lat"], "lng"=>$curRow["gps_long"]];
                }
            }
        }
        return $ret;
    }
}
