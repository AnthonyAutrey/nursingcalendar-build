<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Group Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Read //
$app->get('/groups', function (Request $request, Response $response, array $args) {
	$queryData = getSelectQueryData($request);
	$queryString = DBUtil::buildSelectQuery('groups', $queryData['fields'], $queryData['where']);
	$groups = DBUtil::runQuery($queryString);
	$response->getBody()->write($groups);
	$response = $response->withHeader('Content-type', 'application/json');
	return $response;

	// Get CRNS!
})->add($requireAnyRole);