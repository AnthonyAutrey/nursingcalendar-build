<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require '../../src/api/dependencies/autoload.php';
require '../../src/api/DBUtil.php';
require '../../src/api/middleware/Authenticator.php';

// Configuration //////////////////////////////////////////////////////////////////////////////////////////////////////////
$config = [
    'settings' => [
		'displayErrorDetails' => false,
	],
	'devEnvironment' => true
];

$app = new \Slim\App($config);

// Start Session /////////////////////////////////////////////////////////////////////////////////////////////////////////

$app->add(function ($request, $response, $next) {
	session_start();
	return $next($request, $response);	
});

// Authentication Middleware /////////////////////////////////////////////////////////////////////////////////////////////

$requireAnyRole = new Authenticator(['student', 'instructor', 'administrator']);
$requireInstructorOrAdmin = new Authenticator(['instructor', 'administrator']);
$requireAdmin = new Authenticator(['administrator']);

// Authentication Routes //////////////////////////////////////////////////////////////////////////////////////////////////

$app->post('/login', function (Request $request, Response $response, array $args) {
	$queryData = json_decode($request->getHeader('queryData')[0]);

	if(!isset($queryData->cwid))
		return $response->withStatus(400);
	else if (!isset($queryData->pin))
		return $response->withStatus(400);
	else {
		$cwid = $queryData->cwid;
		$pin = $queryData->pin;
	}

	// TODO: check LDAP to authenticate,
	//	if authenticated, check DB for user. If not in DB, send them to NewUserComponent
	// 	if in DB, override LDAP info with DB info

	$queryString = 'Select * from users where CWID = '.$cwid;
	$userResults = json_decode(DBUtil::runQuery($queryString));

	if (count($userResults) > 0) {
		$result = json_encode(['authenticated' => true]);
		$response->getBody()->write($result);
		$_SESSION["cwid"] = $cwid;
		$_SESSION["role"] = $userResults[0]->UserRole;
		$_SESSION["firstName"] = $userResults[0]->FirstName;
		$_SESSION["lastName"] = $userResults[0]->LastName;
	} else
		session_destroy();

	$response = $response->withHeader('Content-type', 'application/json');
    return $response;
});

$app->get('/logout', function (Request $request, Response $response, array $args) {
	session_destroy();
	
	$response->getBody()->write("Successfully logged out.");
	return $response;
});

$app->get('/session', function (Request $request, Response $response, array $args) {
	if (isset($_SESSION))
		$session = json_encode($_SESSION);
	else 
		$session = json_encode([]);		

	$response->getBody()->write($session);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});


// Event Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/events', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('events', $queryData['fields'], $queryData['where']);
	$events = DBUtil::runQuery($queryString);
	$response->getBody()->write($events);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Read With Group Relation //
$app->get('/eventswithrelations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery(
		'Events left outer join (select EventID as EventGroupID, LocationName as EventGroupLocationName, RoomName as EventGroupRoomName, GroupName, Semester from eventgrouprelation NATURAL join groups) groupJoin '.
		'on groupJoin.EventGroupID = Events.EventID and EventGroupLocationName = LocationName and EventGroupRoomName = RoomName '.
		'left outer join (SELECT EventID as OverrideID from overrideRequests) overrideJoin on EventID = OverrideID '.
		'NATURAL join (select CWID, FirstName, LastName from Users) userJoin',
		'*',
		$queryData['where']
	);
	$joinedEvents = json_decode(DBUtil::runQuery($queryString));
	$eventMap = [];
	foreach ($joinedEvents as $key => $joinedEvent) {
		
		if (!isset($eventMap[
			$joinedEvent->EventID.
			$joinedEvent->LocationName.
			$joinedEvent->RoomName
		])) {
			if(is_null($joinedEvent->GroupName))
				$groups = [];
			else
				$groups = [['GroupName'=>$joinedEvent->GroupName, 'Semester'=>$joinedEvent->Semester]];

			if(is_null($joinedEvent->OverrideID))
				$pendingOverride = false;
			else
				$pendingOverride = true;

			$eventMap[
				$joinedEvent->EventID.
				$joinedEvent->LocationName.
				$joinedEvent->RoomName
			] = [
				'EventID' => $joinedEvent->EventID,
				'LocationName' => $joinedEvent->LocationName,
				'RoomName' => $joinedEvent->RoomName,
				'Title' => $joinedEvent->Title,
				'Description' => $joinedEvent->Description,
				'StartTime' => $joinedEvent->StartTime,
				'EndTime' => $joinedEvent->EndTime,
				'CWID' => $joinedEvent->CWID,
				'Groups' => $groups,
				'OwnerName' => $joinedEvent->FirstName.' '.$joinedEvent->LastName,
				'PendingOverride' => $pendingOverride
			];
		} else {
			array_push($eventMap[
				$joinedEvent->EventID.
				$joinedEvent->LocationName.
				$joinedEvent->RoomName
			]['Groups'], ['GroupName'=>$joinedEvent->GroupName, 'Semester'=>$joinedEvent->Semester]);
		}
	}
	$events = [];
	foreach ($eventMap as $key => $value) {
		array_push($events, $value);
	}
	$response->getBody()->write(json_encode($events));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/events', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryDataArray = getUpdateQueryData($request);

	if (array_key_exists("setValues",$queryDataArray) && array_key_exists("where",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['setValues']) ||
		!isset($queryData['where']) ||
		!isset($queryData['where']['EventID']) ||
		!isset($queryData['where']['LocationName']) ||
		!isset($queryData['where']['RoomName']) ||
		!count($queryData['setValues']) > 0) {
			return $response->withStatus(400);
		}

		$eventID = $queryData['where']['EventID'];
		$location = $queryData['where']['LocationName'];
		$room = $queryData['where']['RoomName'];

		// delete all of the event's groups before resetting them
		$deleteGroupsQuery = DBUtil::buildDeleteQuery('EventGroupRelation', $queryData['where']);
		
		if (isset($queryData['groups']) && !is_null($queryData['groups'])) {
			$results['Delete Groups '.$eventID.', '.$location.', '.$room] = DBUtil::runCommand($deleteGroupsQuery);
			$results['Insert Groups '.$eventID.', '.$location.', '.$room] = insertEventGroups($queryData['groups'], $eventID, $location, $room);
		}
	
		$queryString = DBUtil::buildUpdateQuery('events', $queryData['setValues'], $queryData['where']);	
		$results['Update Event '.$eventID.', '.$location.', '.$room] = DBUtil::runCommand($queryString);
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

})->add($requireInstructorOrAdmin);

// Insert //
$app->put('/events', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues",$queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		// return with 'bad request' response if request isn't correct
		if (!isset($queryData['insertValues']) ||
			!isset($queryData['insertValues']['EventID']) ||
			!isset($queryData['insertValues']['LocationName']) ||
			!isset($queryData['insertValues']['RoomName']) ||
			!insertQueryDataIsValid($queryData['insertValues'])) {
			return $response->withStatus(400);
		}
	
		$eventID = $queryData['insertValues']['EventID'];
		$location = $queryData['insertValues']['LocationName'];
		$room = $queryData['insertValues']['RoomName'];

		$queryString = DBUtil::buildInsertQuery('events', $queryData['insertValues']);
		$results['Insert Event '.', '.$eventID.', '.$location.', '.$room] = DBUtil::runCommand($queryString);

		if (isset($queryData['groups']) && !is_null($queryData['groups'])) {
			$results['Insert Groups '.', '.$eventID.', '.$location.', '.$room] = insertEventGroups($queryData['groups'], $eventID, $location, $room);
		}
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireInstructorOrAdmin);

// Delete //
$app->delete('/events', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$innerGroupsQuery = DBUtil::buildSelectQuery('Events natural join EventGroupRelation','EventID', $queryData['where']);
	$deleteGroupsQuery = 'delete from EventGroupRelation where EventID in (select EventID from ('.$innerGroupsQuery.') deleteEvents)';
	$results['Delete Groups'] = DBUtil::runCommand($deleteGroupsQuery);
	$queryString = DBUtil::buildDeleteQuery('events', $queryData['where']);
	$results['Delete Events'] = DBUtil::runCommand($queryString);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireInstructorOrAdmin);

// Room Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/rooms', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('rooms natural left outer join roomResourceRelation', $queryData['fields'], $queryData['where']);
	$rooms = DBUtil::runQuery($queryString);
	$response->getBody()->write($rooms);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Location Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
$app->put('/locations', function (Request $request, Response $response, array $args) {
	$queryDataArray = getInsertQueryData($request);
	$results = [];

	if (array_key_exists("insertValues", $queryDataArray))
		$queryDataArray = [$queryDataArray];

	foreach ($queryDataArray as $queryData) {
		$queryData = getInsertQueryData($request);
		$queryString = DBUtil::buildInsertQuery('locations', $queryData['insertValues']);
		$results[$queryData['insertValues']] = DBUtil::runCommand($queryString);
	}
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Read //
$app->get('/locations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('locations', $queryData['fields'], $queryData['where']);
	$locations = DBUtil::runQuery($queryString);
	$response->getBody()->write($locations);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Update //
$app->post('/locations', function (Request $request, Response $response, array $args) {
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
	
		$queryString = DBUtil::buildUpdateQuery('locations', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Delete //
$app->delete('/locations', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteLocationsQuery = DBUtil::buildDeleteQuery('locations', $queryData['where']);
	$results = DBUtil::runCommand($deleteLocationsQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

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
	
		$queryString = DBUtil::buildUpdateQuery('resources', $queryData['setValues'], $queryData['where']);	
		array_push($results, DBUtil::runCommand($queryString));
	}

	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// Delete //
$app->delete('/resources', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteQuery = DBUtil::buildDeleteQuery('resources', $queryData['where']);
	$results = DBUtil::runCommand($deleteQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
})->add($requireAdmin);

// User Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

// Delete //
$app->delete('/usergroups', function (Request $request, Response $response, array $args) {
	$queryData = getDeleteQueryData($request);
	$deleteUserGroupsQuery = DBUtil::buildDeleteQuery('UserGroupRelation', $queryData['where']);
	$results = DBUtil::runCommand($deleteUserGroupsQuery);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

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

// Preference Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////

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

// Create //
$app->put('/preferences', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);
	$queryString = DBUtil::buildInsertQuery('preferences', $queryData['insertValues']);
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Group Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

$app->get('/groups', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('groups', $queryData['fields'], $queryData['where']);
	$groups = DBUtil::runQuery($queryString);
	$response->getBody()->write($groups);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

// Log Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/logs', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('logs NATURAL JOIN Users', $queryData['fields'], $queryData['where']);
	$logs = DBUtil::runQuery($queryString);
	$response->getBody()->write($logs);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
})->add($requireAnyRole);

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


// Notification Routes //////////////////////////////////////////////////////////////////////////////////////////////////////

// Insert //
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

// Override Request Routes //////////////////////////////////////////////////////////////////////////////////////////////////

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

// Publish Date ////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/publishdates', function (Request $request, Response $response, array $args) {
	if (file_exists('../../src/api/config/PublishDates.json'))
		$publishDates = file_get_contents('../../src/api/config/PublishDates.json');
	else
		$publishDates = '{ "error" : "no data"}';
	
	$response->getBody()->write($publishDates);
	$response = $response->withHeader('Content-type', 'application/json');	
	return $response;	
})->add($requireAnyRole);

// Write //
$app->put('/publishdates', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);

	// return with 'bad request' response if request isn't correct
	if (!isset($queryData['insertValues']) || !isset($queryData['insertValues']['Start']) || !isset($queryData['insertValues']['End'])) {
		return $response->withStatus(400);
	}

	$publishDates = ['Start' => $queryData['insertValues']['Start'], 'End' => $queryData['insertValues']['End']];
	$fp = fopen('../../src/api/config/PublishDates.json', 'w');
	fwrite($fp, json_encode($publishDates));
	fclose($fp);

	return $response->withStatus(201);
})->add($requireAdmin);

// Query Data Extraction ///////////////////////////////////////////////////////////////////////////////////////////////////
function getSelectQueryData(Request $request) : array {
	$queryData = null;
	$fields = null;
	$where = null;

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->fields))
		$fields = $queryData->fields;
	if (isset($queryData->where))
		$where = $queryData->where;
	
	return sanitize(['fields'=>$fields, 'where'=>$where]);
}

function getInsertQueryData(Request $request) : array {
	$insertValues = null;
	$groups = null;

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);

	if(is_array($queryData)) {
		$queryDataArray = [];
		foreach ($queryData as $qd) {
			if (isset($qd->insertValues)) {
				$insertValues = $qd->insertValues;
				if (isset($qd->groups)) {
					$groups = $qd->groups;
					array_push($queryDataArray, ['insertValues'=>$insertValues, 'groups'=>$groups]);
				} else
					array_push($queryDataArray, ['insertValues'=>$insertValues]);
			}
			else
				array_push($queryDataArray, ['insertValues'=>null]);
		}

		return sanitize($queryDataArray);

	} else {
		if (isset($queryData->insertValues))
			$insertValues = $queryData->insertValues;
		if (isset($queryData->groups))
			$groups = $queryData->groups;
	
		return sanitize(['insertValues'=>$insertValues, 'groups'=>$groups]);
	}
}

function getUpdateQueryData(Request $request) : array {
	$queryData = null;
	$setValues = null;
	$where = null;
	$groups = null;

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);

	if (is_array($queryData)) {
		$queryDataArray = [];
		foreach ($queryData as $qd) {
			if (isset($qd->setValues) && isset($qd->where)) {
				$setValues = $qd->setValues;
				$where = $qd->where;
				if (isset($qd->groups)) {
					$groups = $qd->groups;
					array_push($queryDataArray, ['setValues'=>$setValues, 'where'=>$where, 'groups'=>$groups]);
				} else
					array_push($queryDataArray, ['setValues'=>$setValues, 'where'=>$where]);
			}
			else
				array_push($queryDataArray, ['setValues'=>null, 'where'=>null]);

		}

		return sanitize($queryDataArray);

	} else {

		if (isset($queryData->setValues))
			$setValues = $queryData->setValues;
		if (isset($queryData->where))
			$where = $queryData->where;
		if (isset($queryData->groups))
			$groups = json_decode($qd->groups);
	
		return sanitize(['setValues'=>$setValues, 'where'=>$where, 'groups'=>$groups]);
	}
}

function getDeleteQueryData(Request $request) : array {
	$queryData = null;
	$where = null;

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->where))
		$where = $queryData->where;

	return sanitize(['where'=>$where]);
}

// Event Groups //
function getEventGroupsToInsert(Request $request) : array {
	$groups = null;

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->groups))
		$groups = $queryData->groups;
	else
		return [];
		
	if (is_string($groups))
		$groups = [$groups];

	return sanitize($groups);
}

function insertEventGroups($groups, $eventID, $location, $room) : array {
	$groupsToInsert = $groups;
	$insertResults = [];
	foreach ($groupsToInsert as $groupToInsert) {
		$groupInsertValues = array();
		$groupInsertValues['EventID'] = $eventID;
		$groupInsertValues['LocationName'] = $location;
		$groupInsertValues['RoomName'] = $room;
		$groupInsertValues['GroupName'] = $groupToInsert;
		$groupRelationQueryString = DBUtil::buildInsertQuery('EventGroupRelation', $groupInsertValues);
		$insertResults[$groupToInsert] = DBUtil::runCommand($groupRelationQueryString);
	}
	
	return $insertResults;
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

function insertQueryDataIsValid($insertValues) {
	$valid = true;
	$arrayLength = null;

	foreach ($insertValues as $column => $value) {
		if (is_array($value)) {
			if (is_null($arrayLength))
				$arrayLength = count($value);

			if ($arrayLength != count($value))
				$valid = false;
		} else {
			if (is_null($arrayLength))
				$arrayLength = 0;

			if ($arrayLength != 0)
				$valid = false;
		}
	}

	return $valid;
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