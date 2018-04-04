<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

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