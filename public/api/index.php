<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require '../../src/api/dependencies/autoload.php';
require '../../src/api/DBUtil.php';

// $db = new Database();

// Configuration ////////////////////////////////////////////////////////////////////////////////////////////////////

$config = [
    'settings' => [
        'displayErrorDetails' => false,
	],
	'devEnvironment' => true
];

$app = new \Slim\App($config);

// Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////

$app->get('/hello[/{name}]', function (Request $request, Response $response, array $args) {

	if (isset($args['name']))
		$name = $args['name'];
	else
		$name = 'anonymous';

	$response->getBody()->write("Hello, $name");

    return $response;
});

$app->get('/events', function (Request $request, Response $response, array $args) {
	
	echo DBUtil::runQuery("SELECT * FROM events");
	
});

// Error Handling /////////////////////////////////////////////////////////////////////////////////////////////////////

if (!$config['devEnvironment']) {

	$container = $app->getContainer();

	$container['errorHandler'] = function ($container) {
		return function ($request, $response, $exception) use ($container) {
			// TODO: retrieve logger from $container here and log the error
			$response->getBody()->rewind();
			return $response->withStatus(500)
							->withHeader('Content-Type', 'text/html')
							->write("Oops, something's gone wrong!");
		};
	};

	$container['phpErrorHandler'] = function ($container) {
		return function ($request, $response, $error) use ($container) {
			// TODO: retrieve logger from $container here and log the error
			$response->getBody()->rewind();
			return $response->withStatus(500)
							->withHeader('Content-Type', 'text/html')
							->write("Oops, something's gone wrong!");
		};
	};

	error_reporting(E_ALL & ~E_NOTICE);

}

// Execute /////////////////////////////////////////////////////////////////////////////////////////////////////////////

$app->run();