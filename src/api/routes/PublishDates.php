<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

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