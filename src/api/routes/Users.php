<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// User Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/users', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('Users Natural Left Outer Join (UserGroupRelation Natural Join Groups)', $queryData['fields'], $queryData['where']);
	$joinedUsers = json_decode(DBUtil::runQuery($queryString));
	$userMap = [];
	foreach ($joinedUsers as $key => $joinedUser) {
		if (!isset($userMap[$joinedUser->CWID])) {
			if(is_null($joinedUser->GroupName))
				$groups = [];
			else
				$groups = [['Name'=>$joinedUser->GroupName, 'Description'=>$joinedUser->Description]];

			$userMap[$joinedUser->CWID] = [
				'CWID' => $joinedUser->CWID,
				'FirstName' => $joinedUser->FirstName,
				'LastName' => $joinedUser->LastName,
				'UserRole' => $joinedUser->UserRole,
				'Groups' => $groups
			];
		} else {
			array_push($userMap[$joinedUser->CWID]['Groups'], ['Name'=>$joinedUser->GroupName, 'Description'=>$joinedUser->Description]);
		}
	}
	$users = [];
	foreach ($userMap as $key => $value) {
		array_push($users, $value);
	}

	$response->getBody()->write(json_encode($users));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);