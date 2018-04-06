<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Authentication Routes ////////////////////////////////////////////////////////////////////////////////////////

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

	if (ComputingCenter::authorizeUser($cwid, $pin)) {
		$result = json_encode(['authenticated' => true]);
		$response->getBody()->write($result);
		$userDetails = ComputingCenter::getUserDetails($cwid);

		if (isNewUser($cwid))
			persistNewUser($cwid, $userDetails);
		elseif ($userDetails['role'] == 'instructor') {
			persistName($cwid, $userDetails['firstName'], $userDetails['lastName']);
			if (instructorIsAdmin($cwid)) 
			$userDetails['role'] = 'administrator';
		}
		elseif ($userDetails['role'] == 'student') {
			persistName($cwid, $userDetails['firstName'], $userDetails['lastName']);
			persistUserGroups($cwid, 'student');
		}
		$_SESSION['cwid'] = $cwid;
		$_SESSION['role'] = $userDetails['role'];
		$_SESSION['firstName'] = $userDetails['firstName'];
		$_SESSION['lastName'] = $userDetails['lastName'];

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


// New User /////////////////////////////////////////////////////////////////////////////////////////////

function isNewUser($cwid) {
	$queryString = 'Select count(*) as count from users where CWID = '.$cwid;
	$userCount = json_decode(DBUtil::runQuery($queryString))[0];
	return $userCount->count <= 0;
}

function persistNewUser($cwid, $userDetails) {
	$queryString = 'INSERT INTO Users (CWID, FirstName, LastName, UserRole) '.
		'VALUES ('.$cwid.', "'.$userDetails['firstName'].'", "'.$userDetails['lastName'].'", "'.$userDetails['role'].'")';
	DBUtil::runCommand($queryString);

	if ($userDetails['role'] == 'instructor' || $userDetails['role'] == 'student')
		persistUserGroups($cwid, $userDetails['role']);
}

function persistUserGroups($cwid, $role) {
	if ($role == 'instructor')
		$crns = ComputingCenter::getInstructorCRNs($cwid);
	else
		$crns = ComputingCenter::getStudentCRNs($cwid);

	$deleteUserGroupsQueryString = 'delete from UserGroupRelation where CWID = '.$cwid;
	DBUtil::runCommand($deleteUserGroupsQueryString);

	if (count($crns) <= 0)
		return;

	$groupQueryString = 'select distinct groupname from GroupCRNs where CRN in ('.getCRNsAsCSV($crns).')';
	$groups = json_decode(DBUtil::runQuery($groupQueryString));

	if (count($groups) > 0) {
		$userGroupQueryString = 'INSERT INTO UserGroupRelation (CWID, GroupName) '.
			'VALUES '.getUserGroupValues($cwid, $groups);
	
		DBUtil::runCommand($userGroupQueryString);
	}
}

function getCRNsAsCSV($crns) {
	$csv = '';
	foreach ($crns as $crn) {
		$csv.= $crn. ',';
	}
	$csv = substr($csv, 0, -1);
	
	return $csv;
}

function getUserGroupValues($cwid, $groups) {
	$userGroupValues = '';
	foreach ($groups as $group) {
		$userGroupValues.= '('.$cwid.',"'. $group->groupname . '"),';
	}
	$userGroupValues = substr($userGroupValues, 0, -1);
	
	return $userGroupValues;
}

// Instructor ///////////////////////////////////////////////////////////////////////////////////////////////

function instructorIsAdmin($cwid) {
	$queryString = 'Select UserRole from users where CWID = '.$cwid;
	$result = json_decode(DBUtil::runQuery($queryString))[0];

	return $result->UserRole == 'administrator';	
}

// Misc /////////////////////////////////////////////////////////////////////////////////////////////////////

function persistName($cwid, $first, $last) {
	$queryString = 'UPDATE Users set firstName="'.$first.'", lastName="'.$last.'" where CWID='.$cwid;
	DBUtil::runCommand($queryString);
}