<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Preference Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/preferences', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);
	$queryString = DBUtil::buildInsertQuery('preferences', $queryData['insertValues']);
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Read //
$app->get('/preferences/{CWID}', function (Request $request, Response $response, array $args) {
	$cwid = $args['CWID'];
	$queryData = getSelectQueryData($request);
	if (isset($queryData['where']))
		$queryData['where']['CWID'] = $cwid;
	else
		$queryData['where'] = ['CWID'=> $cwid]; 
	$queryString = DBUtil::buildSelectQuery('preferences', $queryData['fields'], $queryData['where']);
	$preferences = DBUtil::runQuery($queryString);
	$response->getBody()->write($preferences);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/preferences/{CWID}', function (Request $request, Response $response, array $args) {
	$cwid = $args['CWID'];
	$queryData = getUpdateQueryData($request);
	if (isset($queryData['where']))
		$queryData['where']['CWID'] = $cwid;
	else
		$queryData['where'] = ['CWID'=> $cwid];
	$queryString = DBUtil::buildUpdateQuery('preferences', $queryData['setValues'], $queryData['where']);
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);