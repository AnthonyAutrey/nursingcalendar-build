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
	$results = ['Insert Event' => DBUtil::runCommand($queryString)];

	$groupsToInsert = getEventGroupsToInsert($request);
	$groupRelationQueryString = '';
	foreach ($groupsToInsert as $groupToInsert) {
		$groupInsertValues = array();
		$groupInsertValues['eventID'] = $queryData['insertValues']['eventID'];
		$groupInsertValues['groupName'] = $groupToInsert;
		$groupRelationQueryString = DBUtil::buildInsertQuery('EventGroupRelation', $groupInsertValues);
		$results['Insert Groups'][$groupToInsert] = DBUtil::runCommand($groupRelationQueryString);
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});

// Delete //
$app->delete('/events', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$queryString = DBUtil::buildDeleteQuery('events', $queryData['where']);
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Room Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/rooms', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('rooms natural left outer join roomResourceRelation', $queryData['fields'], $queryData['where']);
	$rooms = DBUtil::runQuery($queryString);
	$response->getBody()->write($rooms);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Location Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/locations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('locations', $queryData['fields'], $queryData['where']);
	$locations = DBUtil::runQuery($queryString);
	$response->getBody()->write($locations);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Resource Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/resources', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('resources', $queryData['fields'], $queryData['where']);
	$resources = DBUtil::runQuery($queryString);
	$response->getBody()->write($resources);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// LDAP ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$app->get('/classes', function (Request $request, Response $response, array $args) {
	$classes = [
		'Nursing Class 1',
		'Nursing Class 2',
		'Nursing Class 3',
		'Nursing Class 4',
		'Nursing Class 5',
		'Nursing Class 6',
		'Nursing Class 7','Nursing Class 8',
		'Semester 1', 
		'Semester 2',
		'Semester 3', 
		'Semester 4'
	];
	$response->getBody()->write(json_encode($classes));
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
	
	return sanitize(['fields'=>$fields, 'where'=>$where]);
}

function getInsertQueryData(Request $request) : array {
	$insertValues = null;

	if(count($request->getHeader('queryData')) > 0 and ($request->getHeader('queryData')[0] !== null))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->insertValues))
		$insertValues = $queryData->insertValues;

	return sanitize(['insertValues'=>$insertValues]);
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

	return sanitize(['setValues'=>$setValues, 'where'=>$where]);
}

function getDeleteQueryData(Request $request) : array {
	$queryData = null;
	$where = null;

	if(count($request->getHeader('queryData')) > 0 and ($request->getHeader('queryData')[0] !== null))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->where))
		$where = $queryData->where;

	return sanitize(['where'=>$where]);
}

// Event Groups //
function getEventGroupsToInsert(Request $request) : array {
	$groups = null;

	if(count($request->getHeader('queryData')) > 0 and ($request->getHeader('queryData')[0] !== null))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->groups))
		$groups = $queryData->groups;
	else
		return [];
		
	if (is_string($groups))
		$groups = [$groups];

	return sanitize($groups);
}

function sanitize($o) {
	$o = json_encode($o, true);
	$o = json_decode($o, true);

	if (is_string($o)) {
		$o = addslashes($o);
	}
	else if ($o != null && !is_numeric($o))
		foreach ($o as $key => $value) 
			$o[$key] = sanitize($value);

	return $o;
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