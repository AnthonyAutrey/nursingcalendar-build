<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Resource Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/resources', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		$queryData = getInsertQueryData($request);
		$queryString = DBUtil::buildInsertQuery('resources', $queryData['insertValues']);
		$results[$queryData['insertValues']] = DBUtil::runCommand($queryString);
	}
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Read //
$app->get('/resources', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('resources', $queryData['fields'], $queryData['where']);
	$resources = DBUtil::runQuery($queryString);
	$response->getBody()->write($resources);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/resources', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getUpdateQueryData($request);

	if (array_key_exists("setValues",$queryDataArray) && array_key_exists("where",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['setValues']) ||
			!count($queryData['setValues']) > 0 ||
			!isset($queryData['where'])
			) {
			return $response->withStatus(400);
		}
	
		$queryString = DBUtil::buildUpdateQuery('resources NATURAL JOIN roomResourceRelation', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Delete //
$app->delete('/resources', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteQuery = DBUtil::buildDeleteQuery('resources NATURAL JOIN	roomResourceRelation', $queryData['where']);
	$results = DBUtil::runCommand($deleteQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);