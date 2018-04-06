<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Log Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/logs', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		$queryString = DBUtil::buildInsertQuery('logs', $queryData['insertValues']);
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Read //
$app->get('/logs', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('logs NATURAL JOIN Users', $queryData['fields'], $queryData['where']);
	$logs = DBUtil::runQuery($queryString);
	$response->getBody()->write($logs);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAdmin);

// Delete //
$app->delete('/logs', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteQuery = DBUtil::buildDeleteQuery('logs', $queryData['where']);
	$results = DBUtil::runCommand($deleteQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAdmin);

