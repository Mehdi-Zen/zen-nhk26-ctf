<?php
define('DB_SERVER','127.0.0.1');
define('DB_USER','ctf');
define('DB_PASS' ,'');
define('DB_NAME', 'loginsystem');
$con = mysqli_connect(DB_SERVER,DB_USER,DB_PASS,DB_NAME);

if (!$con) {
    die("Failed to connect to MySQL: " . mysqli_connect_error());
}
