<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Event Routes ///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Create //
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
		'Events left outer join (select EventID as EventGroupID, LocationName as EventGroupLocationName, RoomName as EventGroupRoomName, GroupName from eventgrouprelation NATURAL join groups) groupJoin '.
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
				$groups = [['GroupName'=>$joinedEvent->GroupName]];

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
			]['Groups'], ['GroupName'=>$joinedEvent->GroupName]);
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