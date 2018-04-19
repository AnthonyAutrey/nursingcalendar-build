<?php

echo "Hmm?";

// use \Psr\Http\Message\ServerRequestInterface as Request;
// use \Psr\Http\Message\ResponseInterface as Response;

// require '../../src/api/dependencies/autoload.php';
// require '../../src/api/util/DBUtil.php';
// require '../../src/api/util/ComputingCenter.php';
// require '../../src/api/util/APIUtil.php';
// require '../../src/api/middleware/Authenticator.php';

// // Configuration //////////////////////////////////////////////////////////////////////////////////////////////////////////

// $config = [
//     'settings' => [
// 		'displayErrorDetails' => true,
// 	],
// 	'devEnvironment' => true
// ];

// $app = new \Slim\App($config);

// // Start Session /////////////////////////////////////////////////////////////////////////////////////////////////////////

// $app->add(function ($request, $response, $next) {
// 	session_start();
// 	return $next($request, $response);	
// });

// // Authentication Middleware /////////////////////////////////////////////////////////////////////////////////////////////

// $requireAnyRole = new Authenticator(['student', 'instructor', 'administrator']);
// $requireInstructorOrAdmin = new Authenticator(['instructor', 'administrator']);
// $requireAdmin = new Authenticator(['administrator']);

// // Import Routes ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// require '../../src/api/routes/Authentication.php';
// require '../../src/api/routes/Events.php';
// require '../../src/api/routes/Rooms.php';
// require '../../src/api/routes/Locations.php';
// require '../../src/api/routes/Resources.php';
// require '../../src/api/routes/Users.php';
// require '../../src/api/routes/UserGroups.php';
// require '../../src/api/routes/Preferences.php';
// require '../../src/api/routes/Groups.php';
// require '../../src/api/routes/Logs.php';
// require '../../src/api/routes/Notifications.php';
// require '../../src/api/routes/OverrideRequests.php';
// require '../../src/api/routes/PublishDates.php';

// // Error Handling /////////////////////////////////////////////////////////////////////////////////////////////////////

// if (!$config['devEnvironment']) {

// 	$container = $app->getContainer();

// 	$container['errorHandler'] = function ($container) {
// 		return function ($request, $response, $exception) use ($container) {
// 			// TODO: retrieve logger from $container here and log the error
// 			$response->getBody()->rewind();
// 			return $response->withStatus(500)
// 							->withHeader('Content-Type', 'text/html')
// 							->write("Oops, something's gone wrong!");
// 		};
// 	};

// 	$container['phpErrorHandler'] = function ($container) {
// 		return function ($request, $response, $error) use ($container) {
// 			// TODO: retrieve logger from $container here and log the error
// 			$response->getBody()->rewind();
// 			return $response->withStatus(500)
// 							->withHeader('Content-Type', 'text/html')
// 							->write("Oops, something's gone wrong!");
// 		};
// 	};

// 	error_reporting(E_ALL & ~E_NOTICE);

// }

// // Execute /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// $app->run();