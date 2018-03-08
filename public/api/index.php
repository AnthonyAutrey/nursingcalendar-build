<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require '../../src/api/dependencies/autoload.php';
require '../../src/api/DBUtil.php';

// Configuration //////////////////////////////////////////////////////////////////////////////////////////////////////////
$config = [
    'settings' => [
        'displayErrorDetails' => false,
	],
	'devEnvironment' => true
];

$app = new \Slim\App($config);

// Authentication Routes //////////////////////////////////////////////////////////////////////////////////////////////////

$app->post('/login', function (Request $request, Response $response, array $args) {
	session_start();
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
	} else
		session_destroy();

	$response = $response->withHeader('Content-type', 'application/json');
    return $response;
});

$app->get('/logout', function (Request $request, Response $response, array $args) {
	session_start();
	session_destroy();
	
	$response->getBody()->write("Successfully logged out.");
	return $response;
});

$app->get('/session', function (Request $request, Response $response, array $args) {
	session_start();

	if (isset($_SESSION))
		$session = json_encode($_SESSION);
	else 
		$session = json_encode([]);		

	$response->getBody()->write($session);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});


// Event Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////
$app->get('/hello[/{name}]', function (Request $request, Response $response, array $args) {

	if (isset($args['name']))
		$name = $args['name'];
	else
		$name = 'anonymous';

	$response->getBody()->write("Hello, $name");

    return $response;
});

// Read //
$app->get('/events', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('events', $queryData['fields'], $queryData['where']);
	$events = DBUtil::runQuery($queryString);
	$response->getBody()->write($events);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Read With Group Relation //
$app->get('/eventswithrelations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery(
		'Events natural left outer join EventGroupRelation '.
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
				$groups = [$joinedEvent->GroupName];

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
			]['Groups'], $joinedEvent->GroupName);
		}
	}
	$events = [];
	foreach ($eventMap as $key => $value) {
		array_push($events, $value);
	}
	$response->getBody()->write(json_encode($events));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Update //
$app->post('/events', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryData = getUpdateQueryData($request);

	// return with 'bad request' response if request isn't correct
	if (!isset($queryData['setValues']) ||
		!isset($queryData['where']['EventID']) ||
		!count($queryData['setValues']) > 0 ||
		!isset($queryData['where'])
		) {
		return $response->withStatus(400);
	}

	// delete all of the event's groups before resetting them
	$deleteGroupsQuery = DBUtil::buildDeleteQuery('EventGroupRelation', $queryData['where']);
	$results['Delete Groups'] = DBUtil::runCommand($deleteGroupsQuery);

	$eventID = $queryData['where']['EventID'];
	$location = $queryData['where']['LocationName'];
	$room = $queryData['where']['RoomName'];
	$results['Insert Groups'] = insertEventGroups($request, $eventID, $location, $room);

	$queryString = DBUtil::buildUpdateQuery('events', $queryData['setValues'], $queryData['where']);	
	$results['Update Event'] = DBUtil::runCommand($queryString);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

});

// Insert //
$app->put('/events', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);

	// return with 'bad request' response if request isn't correct
	if (!isset($queryData['insertValues']) || !isset($queryData['insertValues']['EventID'])) {
		return $response->withStatus(400);
	}

	$queryString = DBUtil::buildInsertQuery('events', $queryData['insertValues']);
	$results = ['Insert Event' => DBUtil::runCommand($queryString)];

	$eventID = $queryData['insertValues']['EventID'];
	$location = $queryData['insertValues']['LocationName'];
	$room = $queryData['insertValues']['RoomName'];
	$results['Insert Groups'] = insertEventGroups($request, $eventID, $location, $room);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});

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
});

// Room Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/rooms', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('rooms natural left outer join roomResourceRelation', $queryData['fields'], $queryData['where']);
	$rooms = DBUtil::runQuery($queryString);
	$response->getBody()->write($rooms);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Location Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/locations', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('locations', $queryData['fields'], $queryData['where']);
	$locations = DBUtil::runQuery($queryString);
	$response->getBody()->write($locations);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Resource Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/resources', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('resources', $queryData['fields'], $queryData['where']);
	$resources = DBUtil::runQuery($queryString);
	$response->getBody()->write($resources);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// User Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////
$app->get('/usergroups/{cwid}', function (Request $request, Response $response, array $args) {
	$cwid = $args['cwid'];
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('UserGroupRelation Natural Join Groups', $queryData['fields'], ['CWID' => $cwid]);
	$groups = DBUtil::runQuery($queryString);
	$response->getBody()->write($groups);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Group Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////
$app->get('/groups', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('groups', $queryData['fields'], $queryData['where']);
	$groups = DBUtil::runQuery($queryString);
	$response->getBody()->write($groups);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Notification Routes //////////////////////////////////////////////////////////////////////////////////////////////////////

// Insert //
$app->put('/notifications', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);

	// return with 'bad request' response if request isn't correct
	if (!isset($queryData['insertValues']) ||
		!isset($queryData['insertValues']['ToCWID']) ||
		!isset($queryData['insertValues']['Title']) ||
		!isset($queryData['insertValues']['Message'])
		) {
		return $response->withStatus(400);
	}

	$queryString = DBUtil::buildInsertQuery('notifications', $queryData['insertValues']);
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});

// Read //
$app->get('/notifications/{cwid}', function (Request $request, Response $response, array $args) {
	$cwid = $args['cwid'];
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('notifications', $queryData['fields'], ['ToCWID' => $cwid]);
	$notifications = DBUtil::runQuery($queryString);
	$response->getBody()->write($notifications);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Update //
$app->post('/notifications', function (Request $request, Response $response, array $args) {
	$results = [];
	$queryData = getUpdateQueryData($request);

	// return with 'bad request' response if request isn't correct
	if (!isset($queryData['setValues']) ||
		!count($queryData['setValues']) > 0 ||
		!isset($queryData['where'])
		) {
		return $response->withStatus(400);
	}

	$queryString = DBUtil::buildUpdateQuery('notifications', $queryData['setValues'], $queryData['where']);	
	$results = DBUtil::runCommand($queryString);
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});

// Delete //
$app->delete('/notifications/{id}', function (Request $request, Response $response, array $args) {
	$id = $args['id'];
	$deleteGroupsQuery = DBUtil::buildDeleteQuery('notifications', ['NotificationID' => $id]);
	$results = DBUtil::runCommand($deleteGroupsQuery);
	$response->getBody()->write($results);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Override Request Routes //////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/overriderequests/{id}', function (Request $request, Response $response, array $args) {
	$id = $args['id'];
	$queryData = getSelectQueryData($request);
	if (!isset($queryData['where']))
		$queryData['where'] = ['CWID' => $id];
	else
		$queryData['where']['CWID'] = $id;

	$tableString = 'OverrideRequests NATURAL JOIN events '.
		'NATURAL JOIN (SELECT CWID as RequestorCWID, FirstName as RequestorFirstName, LastName as RequestorLastName from Users) reqUser ';
	$queryString = DBUtil::buildSelectQuery($tableString, $queryData['fields'], $queryData['where']);
	$overrideRequests = DBUtil::runQuery($queryString);
	$response->getBody()->write($overrideRequests);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;	
});

// Create //
$app->put('/overriderequests', function (Request $request, Response $response, array $args) {
	$queryData = getInsertQueryData($request);

	// return with 'bad request' response if request isn't correct
	if (!isset($queryData['insertValues']) || !isset($queryData['insertValues']['EventID'])) {
		return $response->withStatus(400);
	}

	$queryString = DBUtil::buildInsertQuery('overrideRequests', $queryData['insertValues']);
	$results = ['Insert Override Request' => DBUtil::runCommand($queryString)];
	$response->getBody()->write(json_encode($results));
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;
});

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
});

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
});

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

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->insertValues))
		$insertValues = $queryData->insertValues;

	return sanitize(['insertValues'=>$insertValues]);
}

function getUpdateQueryData(Request $request) : array {
	$queryData = null;
	$setValues = null;
	$where = null;

	if(count($request->getHeader('queryData')) > 0 and (!is_null($request->getHeader('queryData')[0])))
		$queryData = json_decode($request->getHeader('queryData')[0]);
	if (isset($queryData->setValues))
		$setValues = $queryData->setValues;
	if (isset($queryData->where))
		$where = $queryData->where;

	return sanitize(['setValues'=>$setValues, 'where'=>$where]);
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

function insertEventGroups(Request $request, $eventID, $location, $room) : array {
	$groupsToInsert = getEventGroupsToInsert($request);
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