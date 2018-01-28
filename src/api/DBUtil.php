<?php

require '../../src/api/config/DBConfig.php';

class DBUtil {

	// Query Execution ////////////////////////////////////////////////////////////////////////////////////////////
	public static function runCommand($query): String {
		try {
			$db = new DBConfig();
			$db = $db->connect();

			$statement = $db->query($query);
			$statement->execute();
			$results = $statement->rowCount();
			$db = null;

			return $results;

		} catch(PDOException $ex) {
			echo $ex->getMessage(); // TODO: remove this for production
			return "error";
		}
	}

	public static function runQuery($query): String {
		try {
			$db = new DBConfig();
			$db = $db->connect();

			$statement = $db->query($query);
			$results = $statement->fetchAll(PDO::FETCH_OBJ);
			$db = null;
			return json_encode($results);

		} catch(PDOException $ex) {
			echo $ex->getMessage(); // TODO: remove this for production
		}
	}

	// Query Building /////////////////////////////////////////////////////////////////////////////////////////////////////
	public static function buildSelectQuery($table, $fields, $where): String {
		$fieldString = DBUtil::getFieldString($fields);
		$filterString = DBUtil::getFilterString($where);

		return "select $fieldString from $table $filterString";
	}

	public static function buildUpdateQuery($table, $setValues, $where): String {
		$setValuesString = DBUtil::getSetValuesString($setValues);
		$filterString = DBUtil::getFilterString($where);

		return "update $table set $setValuesString $filterString";
	}

	public static function buildInsertQuery($table, $insertValues): String {
		$insertStrings = DBUtil::getInsertStrings($insertValues);
		$columns = $insertStrings['columns'];
		$values = $insertStrings['values'];

		return "insert into $table $columns values $values";
	}

	// String Building For Queries ///////////////////////////////////////////////////////////////////////////////////////////
	private static function getInsertStrings($insertValues): array {
		$insertColumnsString = '(';
		$insertValuesString = '(';

		foreach ($insertValues as $column => $value) {
			$insertColumnsString .= "$column, ";
			$insertValuesString .= "'$value', ";
		}
		$insertColumnsString = substr($insertColumnsString, 0, -2) . ")" ;
		$insertValuesString = substr($insertValuesString, 0, -2) . ")" ;

		return ['columns'=>$insertColumnsString, 'values'=>$insertValuesString];
	}

	private static function getSetValuesString($setValues): String {
		$setValuesString = '';

		if (isset($setValues))
			foreach ($setValues as $column => $value)
				$setValuesString .= "$column = '$value', ";
		else
			throw new Exception;

		$setValuesString = substr($setValuesString, 0, -2);
		return $setValuesString;
	}

	private static function getFieldString($fields): String {
		$fieldString = '';

		if (isset($fields)) {
			foreach ($fields as $field) {
				$fieldString .= "$field, ";
			}
			$fieldString = substr($fieldString, 0, -2);
			$fieldString = str_replace(";","", $fieldString);

			if (count($fields) < 1)
				$fieldString = '*';
		}
		else
			$fieldString = '*';

		return $fieldString;
	}

	private static function getFilterString($filters): String {
		$filterString = '';

		if (isset($filters)) {
			if (count($filters) > 0) {
				$filterString = 'where ';
			}

			$valueString;
			foreach ($filters as $field => $values) {
				$filterString.= "$field in ";

				if (count($values) > 0) {
					$valueString = '(';				
					foreach ($values as $value) {
						$valueString.= "$value,";
					}
					$valueString = substr($valueString, 0, -1);	
					$valueString.= ')';
				}
				else {
					$valueString = '()';
				}


				$filterString.= "$valueString and ";
			}

			$filterString = substr($filterString, 0, -5);	
		}

		return $filterString;
	}
}