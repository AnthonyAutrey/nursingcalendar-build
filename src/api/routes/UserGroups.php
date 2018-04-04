<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// UserGroup Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/usergroups', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['insertValues']) || 
		!isset($queryData['insertValues']['CWID']) ||
		!isset($queryData['insertValues']['GroupName']) ||
		!insertQueryDataIsValid($queryData['insertValues'])) {
			return $response->withStatus(400);
		}

		$cwid = $queryData['insertValues']['CWID'];
		$group = $queryData['insertValues']['GroupName'];

		if (is_array($cwid))
			$cwid = json_encode($cwid);
		if (is_array($group))
			$group = json_encode($group);
		
		$queryString = DBUtil::buildInsertQuery('UserGroupRelation', $queryData['insertValues']);
		$results['Insert User Group '.$cwid.', '.$group] = DBUtil::runCommand($queryString);
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAnyRole);

// Read //
$app->get('/usergroups/{cwid}', function (Request $request, Response $response, array $args) {
	$cwid = $args['cwid'];
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('UserGroupRelation Natural Join Groups', $queryData['fields'], ['CWID' => $cwid]);
	$groups = DBUtil::runQuery($queryString);
	$response->getBody()->write($groups);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Delete //
$app->delete('/usergroups', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteUserGroupsQuery = DBUtil::buildDeleteQuery('UserGroupRelation', $queryData['where']);
	$results = DBUtil::runCommand($deleteUserGroupsQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);