<?php

// This class represents integration that will need to be done by the ULM Computing Center before the app can be fully functional
class ComputingCenter {

	// Accepts a CWID and PIN, returns whether the credentials are authentic
	public static function authenticateUser($cwid, $pin) {
		// 1. check LDAP for whether the login credentials are authentic
		// 2. return true if authentic, false if not
		return true;
	}

	public static function getUserRole($cwid) {
		// 1. query banner for the role associated with the input cwid
		// 2. using the results, return either 'student' or 'instructor'
		return 'student';
	}

	// Accepts a student's cwid and returns a string array of CRNs representing the classes for which the student is registered.
	public static function getStudentCRNs($cwid) {
		// 1. execute banner query to get the list of CRNS
		// 2. parse the results into the following format
		$studentCRNs = ['11111', '222222', '333333', '44444', '55555', '666666'];

		// 3. return parsed results
		return $studentCRNs;
	}
}