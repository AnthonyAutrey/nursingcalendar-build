<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

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