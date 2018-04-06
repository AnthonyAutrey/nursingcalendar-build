<?php

// This class represents integration that will need to be done by the ULM Computing Center before the app can be fully functional
class ComputingCenter {

	// Accepts a CWID and PIN, returns whether the credentials are authorized
	public static function authorizeUser($cwid, $pin) {
		// 1. check LDAP for whether the login credentials are authorized 
		// 		(preferably, only authorize ulm students or instructors, excluding all other students and instructors)
		// 2. return true if authentic, false if not

		// The following if for testing purposes only and should be removed for production! 
		$authCWIDs = [
			'00000000',
			'01111111',
			'02222222',
			'10000000',
			'11111111',
			'12222222',
			'20000000',
			'21111111',
			'22222222',
			'12345678'
		];
		return $pin == 'pass' && in_array( $cwid, $authCWIDs);
	}

	public static function getUserDetails($cwid) {
		// 1. query banner for the role, first name, and last name associated with the input cwid
		// 2. return the results in the following format: ['role'=>'student', 'firstName'=>'Tony', 'lastName'=>'Autrey']
		// 3. role may only be returned as 'student' or 'instructor'
		// 4. return formatted results

		// The following is for testing purposes only and should be removed for production!
		$userDetails = [
			'00000000'=>['role'=>'student', 'firstName'=>'Peter', 'lastName'=>'Pham'],
			'01111111'=>['role'=>'student', 'firstName'=>'Brian', 'lastName'=>'Wilson'],
			'02222222'=>['role'=>'student', 'firstName'=>'Benjamin', 'lastName'=>'Lee'],
			'10000000'=>['role'=>'instructor', 'firstName'=>'Kim', 'lastName'=>'Taylor'],
			'11111111'=>['role'=>'instructor', 'firstName'=>'Paul', 'lastName'=>'Wiedemeier'],
			'12222222'=>['role'=>'instructor', 'firstName'=>'Tyler', 'lastName'=>'Greer'],
			'20000000'=>['role'=>'instructor', 'firstName'=>'Jose', 'lastName'=>'Cordova'],
			'21111111'=>['role'=>'instructor', 'firstName'=>'Lon', 'lastName'=>'Smith'],
			'22222222'=>['role'=>'instructor', 'firstName'=>'Virginia', 'lastName'=>'Eaton'],
			'12345678'=>['role'=>'instructor', 'firstName'=>'Sherry', 'lastName'=>'Peveto']
		];

		return $userDetails[$cwid];
	}

	// Accepts a student's cwid and returns a string array of CRNs representing the classes for which the student is registered.
	public static function getStudentCRNs($cwid) {
		// 1. execute banner query to get the list of CRNS
		// 2. parse the results into the following format: ['90000', '10000', '20000', '30000', '40000', '50000']
		// 3. return formatted results

		// The following is for testing purposes only and should be removed for production!
		$studentCRNs = [
			'00000000'=>['43928', '43672', '43678', '43681'],
			'01111111'=>['43936', '43940', '43942'],
			'02222222'=>['43943', '43948', '43953'],
		];

		return $studentCRNs[$cwid];
	}

	// Accepts an instructor's cwid and returns a string array of CRNs representing the classes that the instructor teaches.
	public static function getInstructorCRNs($cwid) {
		// 1. execute banner query to get the list of CRNS
		// 2. parse the results into the following format: ['10000', '11000', '12000', '13000']

		// The following array is for testing purposes only and should be removed for production!
		$instructorCRNs = [
			'10000000'=>['43928', '43929', '43672', '43673', '43678'],
			'11111111'=>['43681', '43936', '43937', '43940', '43941'],
			'12222222'=>['43942', '43943', '43944', '43948', '43949']
		];

		// 3. return parsed results
		return $instructorCRNs[$cwid];
	}
}