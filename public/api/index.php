<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require '../../src/api/dependencies/autoload.php';
require '../../src/api/DBUtil.php';

// Configuration //////////////////////////////////////////////////////////////////////////////////////////////////////////
$config = [
    'settings' => [
        'displayErrorDetails' => false,
	],
	'devEnvironment' => true
];

$app = new \Slim\App($config);

// Event Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////

//TODO: remove this example route
$app->get('/hello[/{name}]', function (Request $request, Response $response, array $args) {

	if (isset($args['name']))
		$name = $args['name'];
	else
		$name = 'anonymous';

	$response->getBody()->write("Hello, $name");

    return $response;
});

// Read //
$app->get('/events', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('events', $queryData['fields'], $queryData['where']);
	$events = DBUtil::runQuery($queryString);
	$response->getBody()->write($events);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Update //
$app->post('/events', function (Request $request, Response $response, array $args) {
	$queryData = getUpdateQueryData($request);

	if (isset($queryData['setValues']) and count($queryData['setValues']) > 0 and isset($queryData['where'])) {
		$queryString = DBUtil::buildUpdateQuery('events', $queryData['setValues'], $queryData['where']);	
		$results = DBUtil::runCommand($queryString);
		$response->getBody()->write(json_encode($results));
		$response = $response->withHeader('Content-type', 'application/json');
		return $response;
	}
	else 
		return $response->withStatus(400);
});

// Insert //
$app->put('/events', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);
	$queryString = DBUtil::buildInsertQuery('events', $queryData['insertValues']);
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});

// Delete //
$app->delete('/events', function (Request $request, Response $response, array $args) {
	// TODO: create delete query builder
	$msg = json_encode(['delete called']);
	$response->getBody()->write($msg);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Query Data Extraction ///////////////////////////////////////////////////////////////////////////////////////////////////
function getSelectQueryData(Request $request) : array {
	$queryData = null;
	$fields = null;
	$where = null;

	if(count($request->getHeader('queryData')) > 0 and ($request->getHeader('queryData')[0] !== null))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->fields))
		$fields = $queryData->fields;
	if (isset($queryData->where))
		$where = $queryData->where;
	
	return ['fields'=>$fields, 'where'=>$where];
}

function getInsertQueryData(Request $request) : array {
	$insertValues = null;

	if(count($request->getHeader('queryData')) > 0 and ($request->getHeader('queryData')[0] !== null))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->insertValues))
		$insertValues = $queryData->insertValues;

	return ['insertValues'=>$insertValues];
}

function getUpdateQueryData(Request $request) : array {
	$queryData = null;
	$setValues = null;
	$where = null;

	if(count($request->getHeader('queryData')) > 0 and ($request->getHeader('queryData')[0] !== null))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->setValues))
		$setValues = $queryData->setValues;
	if (isset($queryData->where))
		$where = $queryData->where;

	return ['setValues'=>$setValues, 'where'=>$where];
}

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