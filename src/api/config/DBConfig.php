<?php

class DBConfig {

	private $dbHost = 'localhost';
	private $dbUsername = 'root';
	private $dbName = 'nursing_calendar';

	public function connect() {
		$dbPassword = getenv("NURSECAL_DB_PASS");
		
		$connectionString = "mysql:host=$this->dbHost;dbname=$this->dbName;";
		$dbConnection = new PDO($connectionString, $this->dbUsername, $dbPassword);
		$dbConnection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		return $dbConnection;	
	}

}
