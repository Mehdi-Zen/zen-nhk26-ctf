<?php
define('DB_SERVER', 'db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'loginsystem');

$con = mysqli_connect(DB_SERVER, DB_USER, NULL, DB_NAME);

//if (!$con) {
//    die("Connection failed: " . mysqli_connect_error());
//}
//echo "Connected successfully";  // Test message
?>

