<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Override Request Routes //////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/overriderequests', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['insertValues']) ||
			!isset($queryData['insertValues']['EventID']) ||
			 !insertQueryDataIsValid($queryData['insertValues'])
		) {
			return $response->withStatus(400);
		}
	
		$queryString = DBUtil::buildInsertQuery('overrideRequests', $queryData['insertValues']);
		$results['Insert Override Request '.$queryData['insertValues']['EventID']] = DBUtil::runCommand($queryString);	
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireInstructorOrAdmin);

// Read //
$app->get('/overriderequests/{id}', function (Request $request, Response $response, array $args) {
	$id = (int) $args['id'];
	$queryData = getSelectQueryData($request);
	if (!isset($queryData['where']))
		$queryData['where'] = ['CWID' => $id];
	else
		$queryData['where']['CWID'] = $id;

	$tableString = 'OverrideRequests NATURAL JOIN events '.
		'NATURAL JOIN (SELECT CWID as RequestorCWID, FirstName as RequestorFirstName, LastName as RequestorLastName from Users) reqUser '.
		'NATURAL JOIN (SELECT CWID, FirstName as OwnerFirstName, LastName as OwnerLastName from Users) ownerUser ';
	$queryString = DBUtil::buildSelectQuery($tableString, $queryData['fields'], $queryData['where']);
	$overrideRequests = DBUtil::runQuery($queryString);
	$response->getBody()->write($overrideRequests);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireInstructorOrAdmin);

$app->get('/overriderequests', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$tableString = 'OverrideRequests NATURAL JOIN events '.
		'NATURAL JOIN (SELECT CWID as RequestorCWID, FirstName as RequestorFirstName, LastName as RequestorLastName from Users) reqUser '.
		'NATURAL JOIN (SELECT CWID, FirstName as OwnerFirstName, LastName as OwnerLastName from Users) ownerUser ';
	$queryString = DBUtil::buildSelectQuery($tableString, $queryData['fields'], $queryData['where']);
	$overrideRequests = DBUtil::runQuery($queryString);
	$response->getBody()->write($overrideRequests);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireInstructorOrAdmin);

// Update //
$app->post('/overriderequests', function (Request $request, Response $response, array $args) {
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
	
		$queryString = DBUtil::buildUpdateQuery('overrideRequests', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireInstructorOrAdmin);

// Delete //
$app->delete('/overriderequests/{id}/{location}/{room}', function (Request $request, Response $response, array $args) {
	$id = $args['id'];
	$location = $args['location'];
	$room = $args['room'];
	$deleteGroupsQuery = DBUtil::buildDeleteQuery('overrideRequests', ['EventID' => $id, 'LocationName' => $location, 'RoomName' => $room]);
	$results = DBUtil::runCommand($deleteGroupsQuery);
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireInstructorOrAdmin);