<?php
/**
 * Created by PhpStorm.
 * User: matthias
 * Date: 17.04.19
 * Time: 13:58
 */



class GeoFence {


    public $id;

    public $points = [];

    public $size = 0;


    public $data = [];

    public function __construct(string $id, array $points)
    {
        $this->id = $id;
        $this->points = $points;
    }


    public function increment(string $what, int $by=1)
    {
        if ( ! isset ($this->data[$what]))
            $this->data[$what] = 0;
        $this->data[$what] += $by;
    }


    public function getInfo() : string
    {
        $ret = "{$this->id} Size: {$this->size}";
        foreach ($this->data as $key => $val)
            $ret .= " $key: $val";
        return $ret;
    }


}



class ClusterAnalyzer {

    private $multiply;


    const LONG_LAT_DIV = 1.6;

    public function __construct(int $multiply=10000)
    {
        $this->multiply = $multiply;
    }



    private $distribution = [];

    private $points = [];


    private function _addEdge($x, $y)
    {
        if ( ! isset ($this->points[$y]))
            $this->points[$y] = [];
        if ( ! isset ($this->points[$y][$x]))
            $this->points[$y][$x] = 0;
        $this->points[$y][$x]++;
    }

    public function addPoint(float $x, float $y)
    {
        $x = ((int)($x * $this->multiply * self::LONG_LAT_DIV)) * 3;
        $y = ((int)($y * $this->multiply)) * 3;

        $distX = (int)($x);
        $distY = (int)($y);

        $this->_addPoint($distX, $distY);
    }

    private function _addPoint(int $distX, int $distY)
    {
        if ( ! isset ($this->distribution[$distX]))
            $this->distribution[$distX] = [];
        if ( ! isset ($this->distribution[$distX][$distY]))
            $this->distribution[$distX][$distY] = 0;
        $this->distribution[$distX][$distY]++;
    }


    public function blur()
    {
        foreach ($this->distribution as $x => $ys) {
            foreach ($ys as $y => $matches) {

                $this->_addPoint($x-1, $y);

                $this->_addPoint($x+1, $y);
                $this->_addPoint($x-1, $y+1);
                $this->_addPoint($x+1, $y+1);
                $this->_addPoint($x-1, $y-1);
                $this->_addPoint($x+1, $y-1);
                $this->_addPoint($x, $y-1);
                $this->_addPoint($x, $y+1);


            }
        }
    }


    public function calculatePoints($threshold=1)
    {
        foreach ($this->distribution as $x => $ys) {
            foreach ($ys as $y => $matches) {
                if ($matches > $threshold) {
                    $this->_addEdge($x, $y);

                    $this->_addEdge($x+1, $y);
                    $this->_addEdge($x-1, $y);

                    $this->_addEdge($x, $y+1);
                    $this->_addEdge($x, $y-1);
                    $this->_addEdge($x+1, $y -1);
                    $this->_addEdge($x-1, $y +1);
                    $this->_addEdge($x-1, $y -1);

                    $this->_addEdge($x + 1, $y +1);

                }
            }
        }
    }



    public function getDistribution() {
        $ret = [];
        foreach ($this->distribution as $x => $ys) {
            foreach ($ys as $y => $dist) {
                $ret[] = [($x + 1)/3/$this->multiply / self::LONG_LAT_DIV , ($y + 1 )/$this->multiply / 3, $dist];
            }
        }
        return $ret;
    }


    private function __removeInnerPoints()
    {
        foreach ($this->points as $y => $xs) {
            foreach ($xs as $x => $matches) {
                if ($matches > 3) {
                    //unset ($this->points[$y][$x]);

                }
            }
        }
    }


    private function __removeEdgeWith4Points()
    {
        foreach ($this->points as $y => $xs) {
            foreach ($xs as $x => $matches) {
                if ($this->__getPointWeight($x,$y+1) !== null &&
                    $this->__getPointWeight($x, $y-1) !== null &&
                    $this->__getPointWeight($x+1, $y) !== null &&
                    $this->__getPointWeight($x-1, $y) !== null &&

                    $this->__getPointWeight($x-1, $y-1) !== null &&
                    $this->__getPointWeight($x+1, $y-1) !== null &&
                    $this->__getPointWeight($x-1, $y+1) !== null &&
                    $this->__getPointWeight($x+1, $y+1) !== null
                ) {
                    $this->points[$y][$x] = 0;

                }
            }
        }
    }



    public function dump()
    {
        $minX = $minY = $maxX = $maxY = null;
        foreach ($this->points as $y => $xs) {
            if ($minY === null) {
                $minY = $maxY = $y;
            }
            if ($y < $minY)
                $minY = $y;
            if ($y > $maxY)
                $maxY = $y;
            foreach ($xs as $x => $matches) {
                if ($minX === null) {
                    $minX = $maxX = $x;
                }
                if ($x < $minX)
                    $minX = $x;
                if ($x > $maxX)
                    $maxX = $x;
            }

        }
        for ($y = $minY-1; $y <= $maxY+1; $y++) {
            for ($x = $minX-1; $x <= $maxX+1; $x++) {
                $val = isset($this->points[$y][$x]) ? $this->points[$y][$x] : "";
                echo str_pad($val, 5);
            }
            echo "\n";
        }

    }


    private function __getPointWeight(int $x, int $y) : ?int
    {
        if ( ! isset($this->points[$y]))
            return null;
        if ( ! isset($this->points[$y][$x]))
            return null;
        if ( $this->points[$y][$x] instanceof GeoFence)
            return null;
        return $this->points[$y][$x];
    }


    private function __getNeighbourCount(int $x, int $y)
    {
        $count = 0;
        if ($this->__getPointWeight($x+1, $y))
            $count++;
        if ($this->__getPointWeight($x-1, $y))
            $count++;
        if ($this->__getPointWeight($x, $y+1))
            $count++;
        if ($this->__getPointWeight($x, $y-1))
            $count++;
        return $count;
    }


    private function __setWeights()
    {
        foreach ($this->points as $y => $xs) {
            foreach ($xs as $x => $matches) {
                if ($matches === 0)
                    continue;
                if ($matches > 2)
                    $this->points[$y][$x] = 4;
            }
        }
    }


    private function __getNextStartPoint() : ?array
    {
        foreach ($this->points as $y => $xs) {
            foreach ($xs as $x => $matches) {
                if ($matches === 1)
                    return [$x, $y];
            }
        }
        return null;
    }




    public function calculate()
    {
        $this->__setWeights();
        $this->__removeEdgeWith4Points();
        // print_r ($this->points);

    }



    private function _findPolygonFramePoints(int $x, int $y, array &$found)
    {
        $weight = $this->__getPointWeight($x, $y);




        while (true) {
            $this->points[$y][$x] = 0;
            $found[] = [($x+1) / 3 / $this->multiply / self::LONG_LAT_DIV, ($y+1) / 3 / $this->multiply];
            if ($this->__getPointWeight($x + 1, $y) > 0) {
                $x++;
                continue;
            }
            if ($this->__getPointWeight($x - 1, $y) > 0) {
                $x--;
                continue;
            }
            if ($this->__getPointWeight($x, $y +1) > 0) {
                $y++;
                continue;
            }
            if ($this->__getPointWeight($x, $y -1) > 0) {
                $y--;
                continue;
            }
            break;
        }

    }

    private function _assignPointsToGeofence(GeoFence $geoFence, $x, $y)
    {

        $geoFence->size++;
        $this->points[$y][$x] = $geoFence;

        if ($this->__getPointWeight($x + 1, $y) === 0) {
            $this->_assignPointsToGeofence($geoFence, $x+1, $y);
        }
        if ($this->__getPointWeight($x - 1, $y) === 0) {
            $this->_assignPointsToGeofence($geoFence, $x-1, $y);
        }
        if ($this->__getPointWeight($x, $y +1) === 0) {
            $this->_assignPointsToGeofence($geoFence, $x, $y+1);
        }
        if ($this->__getPointWeight($x, $y -1) === 0) {
            $this->_assignPointsToGeofence($geoFence, $x, $y-1);
        }

    }

    private $geoFences = [];


    private function getNextPolynom(int $i) : ?array
    {
        $polyPoints = [];
        $startPoint = $this->__getNextStartPoint();
        if ($startPoint === null)
            return null;
        [$x, $y] = $startPoint;

        $this->_findPolygonFramePoints($x, $y, $polyPoints);

        $geofence = new GeoFence($i, $polyPoints);
        $this->_assignPointsToGeofence($geofence, $x, $y);
        $this->geoFences[] = $geofence;

        return $polyPoints;
    }

    public function calculateGeofences()
    {
        $i = 0;
        while ($this->getNextPolynom($i++) !== null) {

        }
    }

    /**
     * @return GeoFence[]
     */
    public function getGeoFences() : array
    {
        return $this->geoFences;
    }

    public function getGeoFenceByCoord(float $x, float $y) : ?GeoFence
    {
        $x = ((int)($x * $this->multiply * self::LONG_LAT_DIV)) * 3;
        $y = ((int)($y * $this->multiply)) * 3;

        if ( ! isset ($this->points[$y][$x]))
            return null;
        return $this->points[$y][$x];
    }
}
