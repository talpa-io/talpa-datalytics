<?php
/**
 * Created by PhpStorm.
 * User: matthias
 * Date: 14.02.19
 * Time: 15:27
 */

namespace Talpa;


use PHPUnit\Framework\TestCase;

class IntegrationTest extends TestCase
{

    public function testPushService()
    {
        $ret = phore_http_request("http://localhost/v1/demo_analytics/push?tmid=TMOCK1&from=1546300800&till=1546300810")->withPostData()->send()->getBodyJson();
        $this->assertEquals(true, $ret["success"]);
    }

    public function testPullService()
    {
        $ret = phore_http_request("http://localhost/v1/demo_analytics?tmids=TMOCK1;TMOCK2&from=1546300800&till=1546300810")->send()->getBodyJson();
        print_r ($ret);
        $this->assertEquals(true, $ret["success"]);
    }

    public function testPullServiceInDebugMode()
    {
        $ret = phore_http_request("http://localhost/v1/demo_analytics?tmids=TMOCK1;TMOCK2&from=1546300800&till=1546300810&debug=1")->send()->getBodyJson();
        print_r ($ret);
        $this->assertEquals(true, $ret["success"]);
    }
}
