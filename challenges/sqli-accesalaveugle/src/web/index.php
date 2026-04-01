<?php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = trim($uri, '/');

switch ($uri) {
    case '':
        require 'index.html';
        break;

    case 'login':
        require 'login/index.php';
        break;

    case 'admin':
        require 'admin/index.php';
        break;

    case 'admin/manage':
        require 'admin/manage-users.php';
        break;

    case 'admin/update':
        require 'admin/update-profile.php';
        break;

    case 'admin/changepassword':
        require 'admin/change-password.php';
        break;

    case 'admin/logout':
        require 'admin/logout.php';
        break;

    case 'welcome':
        require 'welcome/welcome.php';
        break;

    case 'logout':
        require 'welcome/logout.php';
        break;

    default:
        http_response_code(404);
        require 'index.html';
        break;
}

