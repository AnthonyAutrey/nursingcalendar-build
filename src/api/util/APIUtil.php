<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

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
				} 
				else if (isset($qd->CRNs)) {
					$CRNs = $qd->CRNs;
					array_push($queryDataArray, ['insertValues'=>$insertValues, 'CRNs'=>$CRNs]);
				}
				else
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
				} 
				else if (isset($qd->CRNs)) {
					$CRNs = $qd->CRNs;
					array_push($queryDataArray, ['setValues'=>$setValues, 'where'=>$where, 'CRNs'=>$CRNs]);
				}
				else
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
