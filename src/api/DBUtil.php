<?php

require '../../src/api/config/DBConfig.php';

class DBUtil {

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

}