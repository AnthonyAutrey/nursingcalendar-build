/*---------------------------------------------------
--- Drop the existing db and create an empty one ----
---------------------------------------------------*/

DROP DATABASE IF EXISTS nursing_calendar;
CREATE DATABASE nursing_calendar;

/*--------------------
--- Create tables ----
--------------------*/

USE nursing_calendar;

CREATE TABLE Locations
(
	LocationName varchar(60) NOT NULL,
	PRIMARY KEY (LocationName)
);

CREATE TABLE Rooms
(
	RoomName varchar(60) NOT NULL,
	Capacity SmallInt, -- if NULL, room should be regarded as having infinite capacity
	LocationName varchar(60) NOT NULL,
	PRIMARY KEY (RoomName, LocationName),
	FOREIGN KEY (LocationName) REFERENCES Locations(LocationName)
);

CREATE TABLE Resources
(
	ResourceName varchar(60) NOT NULL,
	IsEnumerable Boolean NOT NULL DEFAULT 1,
	PRIMARY KEY (ResourceName)
);

CREATE TABLE Users
(
	CWID INT NOT NULL,
	FirstName VARCHAR(30) NOT NULL,
	LastName VARCHAR(30) NOT NULL,
	UserRole ENUM('student', 'instructor', 'administrator') NOT NULL,
	PRIMARY KEY (CWID)
);

CREATE TABLE Events
(
	EventID INT NOT NULL,
	LocationName varchar(60) NOT NULL,
	RoomName varchar(60) NOT NULL,
	Title varchar(60) NOT NULL,
	Description VARCHAR(300) NOT NULL,
	StartTime DateTime NOT NULL,
	EndTime DateTime NOT NULL,
	CWID INT NOT NULL,
	PRIMARY KEY (EventID, LocationName, RoomName),
	FOREIGN KEY (RoomName) REFERENCES Rooms(RoomName),
	FOREIGN KEY (LocationName) REFERENCES Locations(LocationName),
	FOREIGN KEY (CWID) REFERENCES Users(CWID)
);

CREATE TABLE Groups
(
	GroupName VARCHAR(60) NOT NULL,
	Description VARCHAR(300) NOT NULL,
	PRIMARY KEY (GroupName)
);

CREATE TABLE Preferences
(
	CWID INT NOT NULL,
	PRIMARY KEY (CWID),
	FOREIGN KEY (CWID) REFERENCES Users(CWID)
);

CREATE TABLE Notifications
(
	NotificationID INT NOT NULL AUTO_INCREMENT,
	Title VARCHAR(60) NOT NULL,
	Message VARCHAR(300) NOT NULL,
	SendTime DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	HasBeenSeen Boolean NOT NULL DEFAULT 0,
	FromCWID INT,	-- if NULL, notification is from system
	ToCWID INT NOT NULL,
	PRIMARY KEY (NotificationID),
	FOREIGN KEY (FromCWID) REFERENCES Users(CWID),
	FOREIGN KEY (ToCWID) REFERENCES Users(CWID)
);

CREATE TABLE OverrideRequests
(
	EventID INT NOT NULL,
	LocationName varchar(60) NOT NULL,
	RoomName varchar(60) NOT NULL,
	Message VARCHAR(300) NOT NULL,
	OwnerResponse VARCHAR(300),
	AdminResponse VARCHAR(300),
	Time DateTime NOT NULL,
	Accepted Boolean NOT NULL,
	RequestorCWID INT NOT NULL,
	ResolvingAdminCWID INT, -- if NULL, Admin has not yet resolved this
	PRIMARY KEY (EventID, LocationName, RoomName),
	FOREIGN KEY (EventID) REFERENCES Events(EventID),
	FOREIGN KEY (LocationName) REFERENCES Events(LocationName),
	FOREIGN KEY (RoomName) REFERENCES Events(RoomName),
	FOREIGN KEY (RequestorCWID) REFERENCES Users(CWID),
	FOREIGN KEY (ResolvingAdminCWID) REFERENCES Users(CWID)
);

CREATE TABLE RoomResourceRelation
(
	LocationName varchar(60) NOT NULL,
	RoomName varchar(60) NOT NULL,
	ResourceName varchar(60) NOT NULL,
	Count SmallInt, -- if NULL, this resource isn't countable (example: AV capability)
	PRIMARY KEY (LocationName, RoomName, ResourceName),
	FOREIGN KEY (LocationName) REFERENCES Locations(LocationName),
	FOREIGN KEY (RoomName) REFERENCES Rooms(RoomName),
	FOREIGN KEY (ResourceName) REFERENCES Resources(ResourceName)
);

CREATE TABLE EventGroupRelation
(
	EventID INT NOT NULL,
	LocationName varchar(60) NOT NULL,
	RoomName varchar(60) NOT NULL,
	GroupName VARCHAR(60) NOT NULL,
	PRIMARY KEY (EventID, GroupName),
	FOREIGN KEY (EventID) REFERENCES Events(EventID),
	FOREIGN KEY (LocationName) REFERENCES Events(LocationName),
	FOREIGN KEY (RoomName) REFERENCES Events(RoomName),
	FOREIGN KEY (GroupName) REFERENCES Groups(GroupName)
);

CREATE TABLE UserGroupRelation
(
	CWID INT NOT NULL,
	GroupName VARCHAR(60) NOT NULL,
	PRIMARY KEY (CWID, GroupName),
	FOREIGN KEY (CWID) REFERENCES Users(CWID),
	FOREIGN KEY (GroupName) REFERENCES Groups(GroupName)
);

/*----------------------------------------------
--- Insert initial values into the database ----
----------------------------------------------*/

INSERT INTO Users (CWID, FirstName, LastName, UserRole)
VALUES
	(00000000, 'Student', 'McStudentFace', 'student'),
	(11111111, 'Instructor', 'McInstructorFace', 'instructor'),
	(22222222, 'Admin', 'McAdminFace', 'administrator'),
	(33333333, 'Ned', 'Stark', 'instructor'),
	(44444444, 'Catelyn', 'Stark', 'instructor'),
	(55555555, 'Robb', 'Stark', 'student'),
	(66666666, 'Jon', 'Snow', 'student'),
	(77777777, 'Sansa', 'Stark', 'student'),
	(88888888, 'Arya', 'Stark', 'student'),
	(99999999, 'Bran', 'Stark', 'student');

INSERT INTO Locations (LocationName)
VALUES
	('Nursing Building'),
	('St. Francis'),
	('Glenwood');

INSERT INTO Rooms (RoomName, Capacity, LocationName)
VALUES
	('Room 1', 10, 'Nursing Building'),
	('Room 2', 20, 'Nursing Building'),
	('Room 3', 30, 'Nursing Building'),
	('First Floor', null, 'St. Francis'),
	('Second Floor', null, 'St. Francis'),
	('First Floor', null, 'Glenwood'),
	('Second Floor', null, 'Glenwood'),
	('Auditorium 107', 300, 'Nursing Building'),
	('Room 215', 10, 'Nursing Building'),
	('Lab 218', 75, 'Nursing Building'),
	('Lab 221', 75, 'Nursing Building'),
	('LRC 236', 74, 'Nursing Building'),
	('Room 239A', 1, 'Nursing Building'),
	('Room 242', 55, 'Nursing Building'),
	('Room 243', 10, 'Nursing Building'),
	('Room 315', 1, 'Nursing Building'),
	('Lab 316', 1, 'Nursing Building'),
	('Lab 320', 10, 'Nursing Building'),
	('Room 322', 77, 'Nursing Building'),
	('Room 325', 20, 'Nursing Building'),
	('Room 327', 10, 'Nursing Building'),
	('Room 338-339', 73, 'Nursing Building'),
	('Room 340', 54, 'Nursing Building'),
	('Room 343A', 1, 'Nursing Building')
	;

INSERT INTO Resources (ResourceName, IsEnumerable)
VALUES
	('Clinicals', false),
	('Beds', true),
	('Audio/Video', false),
	('Desks', true),
	('Noel Simulator', false),
	('ICU Simulator', false);

INSERT INTO RoomResourceRelation (LocationName, RoomName, ResourceName, Count)
	VALUES
		('Nursing Building', 'Room 1', 'Beds', 10),
		('Nursing Building', 'Room 1', 'Audio/Video', null),
		('Nursing Building', 'Room 2', 'Audio/Video', null),
		('Nursing Building', 'Room 3', 'Audio/Video', null),
		('St. Francis', 'First Floor', 'Clinicals', null),
		('St. Francis', 'Second Floor', 'Clinicals', null),
		('Glenwood', 'First Floor', 'Clinicals', null),
		('Glenwood', 'Second Floor', 'Clinicals', null),
		('Nursing Building', 'Auditorium 107', 'Audio/Video', null),
		('Nursing Building', 'Room 215', 'Noel Simulator', null),
		('Nursing Building', 'Lab 218', 'Desks', 30),
		('Nursing Building', 'Lab 218', 'Beds', 10),
		('Nursing Building', 'Lab 221', 'Desks', 20),
		('Nursing Building', 'Lab 221', 'Beds', 10),
		('Nursing Building', 'Room 242', 'Audio/Video', null),
		('Nursing Building', 'Room 243', 'ICU Simulator', null),
		('Nursing Building', 'Lab 320', 'Beds', 6),
		('Nursing Building', 'Room 325', 'Beds', 4),
		('Nursing Building', 'Room 327', 'Beds', 3),
		('Nursing Building', 'Room 338-339', 'Audio/Video', null);

INSERT INTO Groups (GroupName, Description)
VALUES
	('Semester 1', 'All Semester 1 Students'),
	('Semester 2', 'All Semester 2 Students'),
	('Semester 3', 'All Semester 3 Students'),
	('Semester 4', 'All Semester 4 Students'),
	('Semester 5', 'All Semester 5 Students'),
	('Anatomy and Physiology', 'The body and diseases'),
	('Gerontology', 'Aging processes and treatments'),
	('Nursing Research', 'Researching techniques'),
	('Med Surg Clinicals', 'Med Surg Clinicals'),
	('Pediatrics Clinicals', 'Pediatrics Clinicals'),
	('Maternity Clinicals', 'Maternity Clinicals'),
	('Med Surg - Rotation 1', 'First clinical rotation group'),
	('Med Surg - Rotation 2', 'Second clinical rotation group'),
	('NURS 2004','Health Assessment'),
	('NURS 2009','Fundamentals of Prof. Nursing Practice'),
	('NURS 2011','Intro to Gerontological Nursing'),
	('NURS 2013','Computing for Nurses'),
	('NURS 3009','Adult Health Nursing I'),
	('NURS 3010','Mental Health Nursing'),
	('NURS 3011','Nursing Synthesis I'),
	('NURS 3028','Adult Health Nursing II'),
	('NURS 3029','Maternal Child Health Nursing'),
	('NURS 3030','Nursing Synthesis II'),
	('NURS 4000','Adult Health Nursing III'),
	('NURS 4001','Nursing Research EBP'),
	('NURS 4002','Nursing Synthesis III'),
	('NURS 4066','Nursing Management'),
	('NURS 4067','Public Health Nursing');

INSERT INTO UserGroupRelation (CWID, GroupName)
VALUES
	(00000000, 'Semester 2'),
	(11111111, 'Anatomy and Physiology'),
	(00000000, 'Nursing Research'),
	(00000000, 'Med Surg Clinicals'),
	(00000000, 'Med Surg - Rotation 1'),
	(11111111, 'Maternity Clinicals'),
	(33333333, 'NURS 2004'),
	(33333333, 'NURS 2009'),
	(33333333, 'NURS 3009'),
	(33333333, 'NURS 3010'),
	(33333333, 'NURS 3011'),
	(33333333, 'NURS 4000'),
	(33333333, 'NURS 4001'),
	(33333333, 'NURS 4066'),
	(44444444, 'NURS 2011'),
	(44444444, 'NURS 2013'),
	(44444444, 'NURS 3028'),
	(44444444, 'NURS 3029'),
	(44444444, 'NURS 3030'),
	(44444444, 'NURS 4002'),
	(44444444, 'NURS 4067'),
	(55555555, 'Semester 5'),
	(55555555, 'NURS 4066'),
	(55555555, 'NURS 4067'),
	(66666666, 'Semester 4'),
	(66666666, 'NURS 4000'),
	(66666666, 'NURS 4001'),
	(77777777, 'Semester 3'),
	(77777777, 'NURS 3028'),
	(77777777, 'NURS 3029'),
	(88888888, 'Semester 1'),
	(88888888, 'NURS 2004'),
	(88888888, 'NURS 2011'),
	(99999999, 'Semester 1'),
	(99999999, 'NURS 2004'),
	(99999999, 'NURS 2009'),
	(99999999, 'NURS 2011'),
	(99999999, 'NURS 2013');

INSERT INTO Notifications (ToCWID, Title, Message)
VALUES
	(00000000, 'Message to Students', 'This is a very important message.'),
	(00000000, 'Regarding Nursing Research...', 'Hello. This is God speaking. Plz write.'),
	(22222222, 'Admin Message', 'This is a very important message.'),
	(22222222, 'Med Surg Clinicals', 'This is a very important message.'),
	(33333333, 'Dummy User: Ned Stark', 'Ned is an instructor'),
	(44444444, 'Dummy User: Catelyn Stark', 'Catelyn is an instructor'),
	(55555555, 'Dummy User: Robb Stark', 'Robb is a semester 5 student'),
	(66666666, 'Dummy User: Jon Snow', 'Jon is a semester 4 student'),
	(77777777, 'Dummy User: Sansa Stark', 'Sansa is a semester 3 student'),
	(88888888, 'Dummy User: Arya Stark', 'Arya is a semester 2 student'),
	(99999999, 'Dummy User: Bran Stark', 'Bran is a semester 1 student');

INSERT INTO Events (EventID, LocationName, RoomName, Title, Description, StartTime, EndTime, CWID)
VALUES
	(0, 'Nursing Building', 'Lab 218', 'Medication Administration', '', '2018-03-13 08:00:00', '2018-03-13 09:00:00', 22222222),
	(1, 'Nursing Building', 'Lab 218', 'Medication Alternate Routes', '', '2018-03-13 09:00:00', '2018-03-13 10:00:00', 22222222),
	(2, 'Nursing Building', 'Lab 218', 'Sterile Dressing', '', '2018-03-13 10:00:00', '2018-03-13 12:00:00', 22222222),
	(3, 'Nursing Building', 'Lab 218', 'Practice Lab Sessions', 'Bring Practice Clothes!', '2018-03-16 09:30:00', '2018-03-16 12:00:00', 22222222),
	(4, 'Nursing Building', 'Lab 218', 'Blood Pressure', '', '2018-03-16 08:30:00', '2018-03-16 09:30:00', 22222222),
	(5, 'Nursing Building', 'Lab 218', 'Fluid and Electrolytes', '', '2018-03-15 09:00:00', '2018-03-15 12:00:00', 22222222),
	(6, 'Nursing Building', 'Lab 218', 'Vital Signs (TPR)', '', '2018-03-15 13:00:00', '2018-03-15 14:00:00', 22222222),
	(7, 'Nursing Building', 'Lab 218', 'Blood Pressure', '', '2018-03-15 14:00:00', '2018-03-15 15:00:00', 22222222),
	(8, 'Nursing Building', 'Lab 218', 'Medication Calculations Competency Exam', '', '2018-03-14 08:00:00', '2018-03-14 09:30:00', 22222222),
	(9, 'Nursing Building', 'Lab 218', 'Medication Transcription (MAR)', '', '2018-03-14 09:30:00', '2018-03-14 10:30:00', 22222222),
	(10, 'Nursing Building', 'Lab 218', 'Rest and Sleep', '', '2018-03-14 10:30:00', '2018-03-14 12:00:00', 22222222),
	(11, 'Nursing Building', 'Lab 218', 'Safety and Security', '', '2018-03-14 13:00:00', '2018-03-14 15:00:00', 22222222),
	(12, 'Nursing Building', 'Lab 218', 'Practice Medication', '', '2018-03-14 15:00:00', '2018-03-14 17:00:00', 22222222);
	
INSERT INTO EventGroupRelation (EventID, LocationName, RoomName, GroupName)
VALUES
	(0, 'Nursing Building', 'Lab 218', 'NURS 2009'),
	(0, 'Nursing Building', 'Lab 218', 'NURS 2004'),
	(1, 'Nursing Building', 'Lab 218', 'NURS 2009'),
	(2, 'Nursing Building', 'Lab 218', 'NURS 4066'),
	(3, 'Nursing Building', 'Lab 218', 'Semester 1'),
	(4, 'Nursing Building', 'Lab 218', 'NURS 2004'),
	(5, 'Nursing Building', 'Lab 218', 'NURS 2009'),
	(6, 'Nursing Building', 'Lab 218', 'NURS 2004'),
	(7, 'Nursing Building', 'Lab 218', 'NURS 2009'),
	(8, 'Nursing Building', 'Lab 218', 'NURS 2011'),
	(9, 'Nursing Building', 'Lab 218', 'NURS 2013'),
	(10, 'Nursing Building', 'Lab 218', 'NURS 2011'),
	(11, 'Nursing Building', 'Lab 218', 'NURS 4000'),
	(12, 'Nursing Building', 'Lab 218', 'NURS 4001');