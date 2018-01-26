<?php

class DBConfig {

	// TODO: use env variables here
	private $dbHost = 'localhost';
	private $dbUsername = 'root';
	private $dbPassword = 'password';
	private $dbName = 'nursing_scheduler';

	public function connect() {

		$connectionString = "mysql:host=$this->dbHost;dbname=$this->dbName;";
		$dbConnection = new PDO($connectionString, $this->dbUsername, $this->dbPassword);
		$dbConnection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		return $dbConnection;
		
	}

}
