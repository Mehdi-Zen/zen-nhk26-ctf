<?php
/*
    Personal Home Page Tools
    Simple access logger
    (c) 1996-1998
*/

$log_file = "access.log";
$date     = date("Y-m-d H:i:s");
$ip       = getenv("REMOTE_ADDR");
$agent    = getenv("HTTP_USER_AGENT");
$referer  = getenv("HTTP_REFERER");
$uri      = getenv("REQUEST_URI");

if (!$ip) {
    $ip = "unknown";
}

if (!$agent) {
    $agent = "unknown";
}

if (!$referer) {
    $referer = "-";
}

$entry = $date . "\t" .
         $ip . "\t" .
         $uri . "\t" .
         $referer . "\t" .
         $agent . "\n";

$fp = fopen($log_file, "a");

if ($fp) {
    fwrite($fp, $entry);
    fclose($fp);
}

echo "<html>";
echo "<head><title>Visitor Counter</title></head>";
echo "<body>";

echo "<h2>Page Access Information</h2>";

echo "<pre>";
echo "Date:     " . htmlspecialchars($date) . "\n";
echo "IP:       " . htmlspecialchars($ip) . "\n";
echo "Request:  " . htmlspecialchars($uri) . "\n";
echo "Referer:  " . htmlspecialchars($referer) . "\n";
echo "Agent:    " . htmlspecialchars($agent) . "\n";
echo "</pre>";

$hits = 0;

if (file_exists($log_file)) {
    $lines = file($log_file);
    $hits = count($lines);
}

echo "<hr>";
echo "Total accesses logged: " . $hits;

echo "</body>";
echo "</html>";
?>
