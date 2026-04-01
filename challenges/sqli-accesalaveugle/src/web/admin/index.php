<?php
session_start();
error_reporting(0);
include("dbconnection.php");

if (isset($_POST['login'])) {

    $adminusername = $_POST['username'];
    $password = $_POST['password'];

    $sql = "SELECT * FROM admin WHERE username='$adminusername'";
    $ret = mysqli_query($con, $sql);
    //$user = mysqli_fetch_assoc($ret);
    if ($ret === false) {
        echo "<!-- SQL ERROR -->";
        $user = null;
    } else {
        $user = mysqli_fetch_assoc($ret);
    }

    if ($user && $password === $user['password']) {
        $_SESSION['login'] = $user['username'];
        $_SESSION['id'] = $user['id'];
        header("Location: admin/manage");
        exit();
    } else {
        $error = "Invalid credentials";
    }
}
?>


<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="Dashboard">
    <meta name="keyword" content="Dashboard, Bootstrap, Admin, Template, Theme, Responsive, Fluid, Retina">

    <title>Admin | Login</title>
    <link href="assets/css/bootstrap.css" rel="stylesheet">
    <link href="assets/font-awesome/css/font-awesome.css" rel="stylesheet" />
    <link href="assets/css/style.css" rel="stylesheet">
    <link href="assets/css/style-responsive.css" rel="stylesheet">
  </head>

  <body>
	  <div id="login-page">
	  	<div class="container">
      
	  	
		      <form class="form-login" action="" method="post">
		        <h2 class="form-login-heading">sign in now</h2>
		        <div class="login-wrap">
		            <input type="text" name="username" class="form-control" placeholder="User ID" autofocus>
		            <br>
		            <input type="password" name="password" class="form-control" placeholder="Password"><br >
		            <input  name="login" class="btn btn-theme btn-block" type="submit">
		         
		        </div>
		      </form>	  	
	  	
	  	</div>
	  </div>
    <script src="assets/js/jquery.js"></script>
    <script src="assets/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="assets/js/jquery.backstretch.min.js"></script>
    <script>
        $.backstretch("assets/img/login-bg.jpg", {speed: 500});
    </script>


  </body>
</html>
