<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Group Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

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