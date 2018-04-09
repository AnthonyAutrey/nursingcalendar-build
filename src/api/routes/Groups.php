<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Group Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/groups', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['insertValues']) ||
		!isset($queryData['insertValues']['GroupName']) ||
		!isset($queryData['insertValues']['Description'])) {
			return $response->withStatus(400);
		}

		$queryString = DBUtil::buildInsertQuery('groups', $queryData['insertValues']);
		array_push($results, DBUtil::runCommand($queryString));

		if (isset($queryData['CRNs']) && !is_null($queryData['CRNs'])) {
			$groupName = $queryData['insertValues']['GroupName'];
			array_push($results, insertGroupCRNs($queryData['CRNs'], $groupName));
		}
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

})->add($requireAdmin);

// Read //
$app->get('/groups', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('groups natural left outer join groupcrns', $queryData['fields'], $queryData['where']);
	$joinedGroups = json_decode(DBUtil::runQuery($queryString));

	$groupMap = [];
	foreach ($joinedGroups as $key => $joinedGroup) {
		if (!isset($groupMap[$joinedGroup->GroupName])) {
			if(is_null($joinedGroup->CRN))
				$crns = [];
			else
				$crns = [$joinedGroup->CRN];

			$groupMap[$joinedGroup->GroupName] = [
				'GroupName' => $joinedGroup->GroupName,
				'Description' => $joinedGroup->Description,
				'CRNs' => $crns
			];
		} else {
			array_push($groupMap[$joinedGroup->GroupName]['CRNs'], $joinedGroup->CRN);
		}
	}
	$groups = [];
	foreach ($groupMap as $key => $value) {
		array_push($groups, $value);
	}

	$response->getBody()->write(json_encode($groups));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

})->add($requireAnyRole);

// Read //
$app->get('/semestergroups', function (Request $request, Response $response, array $args) {
	$queryString = 'SELECT distinct groups.groupName as Semester, g.GroupName '.
		'FROM groups natural join groupcrns join groupcrns as g on g.CRN = groupcrns.CRN '.
		'where groups.GroupName in ("Semester 1","Semester 2","Semester 3","Semester 4","Semester 5")';

	$semesterGroups = json_decode(DBUtil::runQuery($queryString));
	$response->getBody()->write(json_encode($semesterGroups));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

})->add($requireAnyRole);


// Update //
$app->post('/groups', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getUpdateQueryData($request);

	if (array_key_exists("setValues",$queryDataArray) && array_key_exists("where",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['setValues']) ||
		!isset($queryData['where']) ||
		!isset($queryData['where']['GroupName']) ||
		!count($queryData['setValues']) > 0) {
			return $response->withStatus(400);
		}

		$groupName = $queryData['where']['GroupName'];
		
		// delete all of the groups's crns before resetting them
		if (isset($queryData['CRNs']) && !is_null($queryData['CRNs'])) {
			$deleteCRNsQuery = DBUtil::buildDeleteQuery('GroupCRNs', $queryData['where']);
			$results['Delete CRNs: '.$groupName] = DBUtil::runCommand($deleteCRNsQuery);
			$results['Insert Groups: '.$groupName] = insertGroupCRNs($queryData['CRNs'], $groupName);
		}

		$queryString = DBUtil::buildUpdateQuery('groups natural left join groupcrns', $queryData['setValues'], $queryData['where']);	
		$results['Update Group '.$groupName] = DBUtil::runCommand($queryString);
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

})->add($requireAdmin);

// Delete //
$app->delete('/groups', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$results = [];

	$deleteCRNsQuery = DBUtil::buildDeleteQuery('groupCRNs', $queryData['where']);
	$deleteUserGroupsQuery = DBUtil::buildDeleteQuery('userGroupRelation', $queryData['where']);
	$deleteEventGroupsQuery = DBUtil::buildDeleteQuery('eventGroupRelation', $queryData['where']);
	$deleteGroupsQuery = DBUtil::buildDeleteQuery('groups', $queryData['where']);

	array_push($results, DBUtil::runCommand($deleteCRNsQuery));
	array_push($results, DBUtil::runCommand($deleteUserGroupsQuery));
	array_push($results, DBUtil::runCommand($deleteEventGroupsQuery));
	array_push($results, DBUtil::runCommand($deleteGroupsQuery));

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
	
})->add($requireAnyRole);

// Utilities //
function insertGroupCRNs($crns, $groupName) : array {
	$insertResults = [];
	foreach ($crns as $crnToInsert) {
		$crnInsertValues = array();
		$crnInsertValues['GroupName'] = $groupName;
		$crnInsertValues['CRN'] = $crnToInsert;
		$crnRelationQueryString = DBUtil::buildInsertQuery('GroupCRNs', $crnInsertValues);
		$insertResults[$crnToInsert] = DBUtil::runCommand($crnRelationQueryString);
	}
	
	return $insertResults;
}