<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Notification Routes //////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/notifications', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['insertValues']) ||
			!isset($queryData['insertValues']['ToCWID']) ||
			!isset($queryData['insertValues']['Title']) ||
			!isset($queryData['insertValues']['Message']) ||
			!insertQueryDataIsValid($queryData['insertValues'])
			) {
			return $response->withStatus(400);
		}
	
		$queryString = DBUtil::buildInsertQuery('notifications', $queryData['insertValues']);
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAnyRole);

// Read //
$app->get('/notifications/{cwid}', function (Request $request, Response $response, array $args) {
	$cwid = $args['cwid'];
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('notifications', $queryData['fields'], ['ToCWID' => $cwid]);
	$notifications = DBUtil::runQuery($queryString);
	$response->getBody()->write($notifications);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/notifications', function (Request $request, Response $response, array $args) {
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
	
		$queryString = DBUtil::buildUpdateQuery('notifications', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAnyRole);

// Delete //
$app->delete('/notifications/{id}', function (Request $request, Response $response, array $args) {
	$id = $args['id'];
	$deleteGroupsQuery = DBUtil::buildDeleteQuery('notifications', ['NotificationID' => $id]);
	$results = DBUtil::runCommand($deleteGroupsQuery);
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);
