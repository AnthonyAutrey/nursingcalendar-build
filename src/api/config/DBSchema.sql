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
	CollapseEvents BOOLEAN NOT NULL DEFAULT 0,
	EventSize INT NOT NULL DEFAULT 19,
	EventDisplay ENUM('title', 'class', 'classAndRoom', 'titleAndRoom') NOT NULL DEFAULT 'title',
	PRIMARY KEY (CWID),
	FOREIGN KEY (CWID) REFERENCES Users(CWID)
);

CREATE TABLE Notifications
(
	NotificationID INT NOT NULL AUTO_INCREMENT,
	Title VARCHAR(60) NOT NULL,
	Message VARCHAR(600) NOT NULL,
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
	Time DateTime NOT NULL,
	Denied Boolean NOT NULL DEFAULT 0,
	RequestorCWID INT NOT NULL,
	AdminRequested Boolean NOT NULL DEFAULT 0,
	PRIMARY KEY (EventID, LocationName, RoomName),
	FOREIGN KEY (EventID, LocationName, RoomName) REFERENCES Events(EventID, LocationName, RoomName),
	FOREIGN KEY (RequestorCWID) REFERENCES Users(CWID)
);

CREATE TABLE Logs
(
	LogID INT NOT NULL AUTO_INCREMENT,
	CWID INT NOT NULL,
	Message VARCHAR(300) NOT NULL,
	Details VARCHAR(1024),
	Time DateTime NOT NULL DEFAULT CURRENT_TIMESTAMP,	
	PRIMARY KEY (LogID),
	FOREIGN KEY (CWID) REFERENCES Users(CWID)
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
	PRIMARY KEY (EventID, LocationName, RoomName, GroupName),
	FOREIGN KEY (EventID, LocationName, RoomName) REFERENCES Events(EventID, LocationName, RoomName),
	FOREIGN KEY (GroupName) REFERENCES Groups(GroupName) ON UPDATE CASCADE
);

CREATE TABLE UserGroupRelation
(
	CWID INT NOT NULL,
	GroupName VARCHAR(60) NOT NULL,
	PRIMARY KEY (CWID, GroupName),
	FOREIGN KEY (CWID) REFERENCES Users(CWID),
	FOREIGN KEY (GroupName) REFERENCES Groups(GroupName) ON UPDATE CASCADE
);

CREATE TABLE RecurrringEventRelation
(
	RecurringID CHAR(36) NOT NULL, -- uuid
	EventID INT NOT NULL,
	LocationName varchar(60) NOT NULL,
	RoomName varchar(60) NOT NULL,
	RecurringType ENUM('daily', 'weekly', 'monthly') NOT NULL,
	MonthlyWeekday CHAR(2),
		-- 1 for first, 2 for second, 3 for third, 4 for fourth, 5 for last,
		-- character represents day of week for recurrence (mtwrfsu),
		-- example: '2f' for every second friday, '5u' for every last sunday
		-- if doesn't recur monthly, then NULL
	WeeklyDays VARCHAR(7), -- use single character identifiers: (mtwrfsu), if doesn't recur weekly, then NULL
	PRIMARY KEY (RecurringID, EventID, LocationName, RoomName),
	FOREIGN KEY (EventID, LocationName, RoomName) REFERENCES Events(EventID, LocationName, RoomName)
);

CREATE TABLE GroupCRNs
(
	GroupName VARCHAR(60) NOT NULL,
	CRN CHAR(5) NOT NULL,
	PRIMARY KEY (GroupName, CRN),
	CONSTRAINT
		FOREIGN KEY (GroupName) 
		REFERENCES Groups(GroupName)
	 	ON UPDATE CASCADE
);

/*----------------------------------------------
--- Insert initial values into the database ----
----------------------------------------------*/

INSERT INTO Users (CWID, FirstName, LastName, UserRole)
VALUES
	/* (00000000, 'Student', 'McStudentFace', 'student'),
	(11111111, 'Instructor', 'McInstructorFace', 'instructor'), */
	(11111111, 'Instructor', 'McInstructorFace', 'instructor'),
	(12345678, 'Sherry', 'Peveto', 'administrator');
	/* (33333333, 'Ned', 'Stark', 'instructor'),
	(44444444, 'Catelyn', 'Stark', 'instructor'),
	(55555555, 'Robb', 'Stark', 'student'),
	(66666666, 'Jon', 'Snow', 'student'),
	(77777777, 'Sansa', 'Stark', 'student'),
	(88888888, 'Arya', 'Stark', 'student'),
	(99999999, 'Bran', 'Stark', 'student'); */

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
	('Room 343A', 1, 'Nursing Building');

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

	('NURS 2004','Health Assessment'),
	('NURS 2004 A','Health Assessment, Section A'),
	('NURS 2004 B','Health Assessment, Section B'),
	('NURS 2004 C','Health Assessment, Section C'),
	('NURS 2004 D','Health Assessment, Section D'),
	('NURS 2004 E','Health Assessment, Section E'),
	('NURS 2004 F','Health Assessment, Section F'),
	('NURS 2004 G','Health Assessment, Section G'),

	('NURS 2009','Fundamentals of Prof. Nursing Practice'),
	('NURS 2009 A','Fundamentals of Prof. Nursing Practice, Section A'),
	('NURS 2009 B','Fundamentals of Prof. Nursing Practice, Section B'),
	('NURS 2009 C','Fundamentals of Prof. Nursing Practice, Section C'),
	('NURS 2009 D','Fundamentals of Prof. Nursing Practice, Section D'),
	('NURS 2009 E','Fundamentals of Prof. Nursing Practice, Section E'),
	('NURS 2009 F','Fundamentals of Prof. Nursing Practice, Section F'),
	('NURS 2009 G','Fundamentals of Prof. Nursing Practice, Section G'),

	('NURS 2011','Intro to Gerontological Nursing'),
	('NURS 2011 A','Intro to Gerontological Nursing, Section A'),
	('NURS 2011 B','Intro to Gerontological Nursing, Section B'),
	('NURS 2011 C','Intro to Gerontological Nursing, Section C'),

	('NURS 2013','Computing for Nurses'),
	('NURS 2013 A','Computing for Nurses, Section A'),
	('NURS 2013 B','Computing for Nurses, Section B'),
	('NURS 2013 C','Computing for Nurses, Section C'),

	('NURS 3009','Adult Health Nursing I'),
	('NURS 3009 A','Adult Health Nursing I, Section A'),
	('NURS 3009 B','Adult Health Nursing I, Section B'),
	('NURS 3009 C','Adult Health Nursing I, Section C'),
	('NURS 3009 D','Adult Health Nursing I, Section D'),
	('NURS 3009 E','Adult Health Nursing I, Section E'),
	('NURS 3009 F','Adult Health Nursing I, Section F'),

	('NURS 3010','Mental Health Nursing'),
	('NURS 3010 A','Mental Health Nursing, Section A'),
	('NURS 3010 B','Mental Health Nursing, Section B'),
	('NURS 3010 C','Mental Health Nursing, Section C'),
	('NURS 3010 D','Mental Health Nursing, Section D'),
	('NURS 3010 E','Mental Health Nursing, Section E'),
	('NURS 3010 F','Mental Health Nursing, Section F'),

	('NURS 3011','Nursing Synthesis I'),

	('NURS 3028','Adult Health Nursing II'),
	('NURS 3028 A','Adult Health Nursing II, Section A'),
	('NURS 3028 B','Adult Health Nursing II, Section B'),
	('NURS 3028 C','Adult Health Nursing II, Section C'),
	('NURS 3028 D','Adult Health Nursing II, Section D'),
	('NURS 3028 E','Adult Health Nursing II, Section E'),

	('NURS 3029','Maternal Child Health Nursing'),
	('NURS 3029 A','Maternal Child Health Nursing, Section A'),
	('NURS 3029 B','Maternal Child Health Nursing, Section B'),
	('NURS 3029 C','Maternal Child Health Nursing, Section C'),
	('NURS 3029 D','Maternal Child Health Nursing, Section D'),
	('NURS 3029 E','Maternal Child Health Nursing, Section E'),
	('NURS 3029 F','Maternal Child Health Nursing, Section F'),

	('NURS 3030','Nursing Synthesis II'),

	('NURS 4000','Adult Health Nursing III'),
	('NURS 4000 A','Adult Health Nursing III, Section A'),
	('NURS 4000 B','Adult Health Nursing III, Section B'),
	('NURS 4000 C','Adult Health Nursing III, Section C'),
	('NURS 4000 D','Adult Health Nursing III, Section D'),
	('NURS 4000 E','Adult Health Nursing III, Section E'),
	('NURS 4000 F','Adult Health Nursing III, Section F'),
	('NURS 4000 G','Adult Health Nursing III, Section G'),
	('NURS 4000 H','Adult Health Nursing III, Section H'),
	('NURS 4000 I','Adult Health Nursing III, Section I'),

	('NURS 4001','Nursing Research EBP'),

	('NURS 4002','Nursing Synthesis III'),

	('NURS 4066','Nursing Management'),
	('NURS 4066 A','Nursing Management, Section A'),
	('NURS 4066 B','Nursing Management, Section B'),
	('NURS 4066 C','Nursing Management, Section C'),

	('NURS 4067','Public Health Nursing'),
	('NURS 4067 A','Public Health Nursing, Section A'),
	('NURS 4067 B','Public Health Nursing, Section B'),
	('NURS 4067 C','Public Health Nursing, Section C'),
	('NURS 4067 D','Public Health Nursing, Section D');

INSERT INTO GroupCRNs (GroupName, CRN)
VALUES
	('Semester 1','43928'),
	('Semester 1','43929'),
	('Semester 1','43930'),
	('Semester 1','43931'),
	('Semester 1','43932'),
	('Semester 1','44186'),
	('Semester 1','44187'),
	('Semester 1','43672'),
	('Semester 1','43673'),
	('Semester 1','43675'),
	('Semester 1','43677'),
	('Semester 1','43933'),
	('Semester 1','43934'),
	('Semester 1','44188'),
	('Semester 1','43678'),
	('Semester 1','43679'),
	('Semester 1','43935'),
	('Semester 1','43681'),
	('Semester 1','43682'),
	('Semester 1','43683'),

	('Semester 2','43936'),
	('Semester 2','43937'),
	('Semester 2','43938'),
	('Semester 2','43939'),
	('Semester 2','44270'),
	('Semester 2','44523'),
	('Semester 2','43940'),
	('Semester 2','43941'),
	('Semester 2','44035'),
	('Semester 2','44036'),
	('Semester 2','44388'),
	('Semester 2','44389'),
	('Semester 2','43942'),

	('Semester 3','43943'),
	('Semester 3','43944'),
	('Semester 3','43945'),
	('Semester 3','43946'),
	('Semester 3','44193'),
	('Semester 3','43948'),
	('Semester 3','43949'),
	('Semester 3','43952'),
	('Semester 3','44216'),
	('Semester 3','44224'),
	('Semester 3','44225'),
	('Semester 3','43953'),

	('Semester 4','44195'),
	('Semester 4','44196'),
	('Semester 4','44197'),
	('Semester 4','44198'),
	('Semester 4','44199'),
	('Semester 4','44200'),
	('Semester 4','44272'),
	('Semester 4','44415'),
	('Semester 4','44524'),
	('Semester 4','44201'),
	('Semester 4','44217'),

	('Semester 5','44202'),
	('Semester 5','44203'),
	('Semester 5','44204'),
	('Semester 5','44205'),
	('Semester 5','44206'),
	('Semester 5','44207'),
	('Semester 5','44208'),

	('NURS 2004','43928'),
	('NURS 2004','43929'),
	('NURS 2004','43930'),
	('NURS 2004','43931'),
	('NURS 2004','43932'),
	('NURS 2004','44186'),
	('NURS 2004','44187'),
	('NURS 2004 A','43928'),
	('NURS 2004 B','43929'),
	('NURS 2004 C','43930'),
	('NURS 2004 D','43931'),
	('NURS 2004 E','43932'),
	('NURS 2004 F','44186'),
	('NURS 2004 G','44187'),

	('NURS 2009','43672'),
	('NURS 2009','43673'),
	('NURS 2009','43675'),
	('NURS 2009','43677'),
	('NURS 2009','43933'),
	('NURS 2009','43934'),
	('NURS 2009','44188'),
	('NURS 2009 A','43672'),
	('NURS 2009 B','43673'),
	('NURS 2009 C','43675'),
	('NURS 2009 D','43677'),
	('NURS 2009 E','43933'),
	('NURS 2009 F','43934'),
	('NURS 2009 G','44188'),

	('NURS 2011','43678'),
	('NURS 2011','43679'),
	('NURS 2011','43935'),
	('NURS 2011 A','43678'),
	('NURS 2011 B','43679'),
	('NURS 2011 C','43935'),

	('NURS 2013','43681'),
	('NURS 2013','43682'),
	('NURS 2013','43683'),
	('NURS 2013 A','43681'),
	('NURS 2013 B','43682'),
	('NURS 2013 C','43683'),

	('NURS 3009','43936'),
	('NURS 3009','43937'),
	('NURS 3009','43938'),
	('NURS 3009','43939'),
	('NURS 3009','44270'),
	('NURS 3009','44523'),
	('NURS 3009 A','43936'),
	('NURS 3009 B','43937'),
	('NURS 3009 C','43938'),
	('NURS 3009 D','43939'),
	('NURS 3009 E','44270'),
	('NURS 3009 F','44523'),

	('NURS 3010','43940'),
	('NURS 3010','43941'),
	('NURS 3010','44035'),
	('NURS 3010','44036'),
	('NURS 3010','44388'),
	('NURS 3010','44389'),
	('NURS 3010 A','43940'),
	('NURS 3010 B','43941'),
	('NURS 3010 C','44035'),
	('NURS 3010 D','44036'),
	('NURS 3010 E','44388'),
	('NURS 3010 F','44389'),

	('NURS 3011','43942'),

	('NURS 3028','43943'),
	('NURS 3028','43944'),
	('NURS 3028','43945'),
	('NURS 3028','43946'),
	('NURS 3028','44193'),
	('NURS 3028 A','43943'),
	('NURS 3028 B','43944'),
	('NURS 3028 C','43945'),
	('NURS 3028 D','43946'),
	('NURS 3028 E','44193'),

	('NURS 3029','43948'),
	('NURS 3029','43949'),
	('NURS 3029','43952'),
	('NURS 3029','44216'),
	('NURS 3029','44224'),
	('NURS 3029','44225'),
	('NURS 3029 A','43948'),
	('NURS 3029 B','43949'),
	('NURS 3029 C','43952'),
	('NURS 3029 D','44216'),
	('NURS 3029 E','44224'),
	('NURS 3029 F','44225'),

	('NURS 3030','43953'),

	('NURS 4000','44195'),
	('NURS 4000','44196'),
	('NURS 4000','44197'),
	('NURS 4000','44198'),
	('NURS 4000','44199'),
	('NURS 4000','44200'),
	('NURS 4000','44272'),
	('NURS 4000','44415'),
	('NURS 4000','44524'),
	('NURS 4000 A','44195'),
	('NURS 4000 B','44196'),
	('NURS 4000 C','44197'),
	('NURS 4000 D','44198'),
	('NURS 4000 E','44199'),
	('NURS 4000 F','44200'),
	('NURS 4000 G','44272'),
	('NURS 4000 H','44415'),
	('NURS 4000 I','44524'),

	('NURS 4001','44201'),

	('NURS 4002','44217'),

	('NURS 4066','44202'),
	('NURS 4066','44203'),
	('NURS 4066','44204'),
	('NURS 4066 A','44202'),
	('NURS 4066 B','44203'),
	('NURS 4066 C','44204'),

	('NURS 4067','44205'),
	('NURS 4067','44206'),
	('NURS 4067','44207'),
	('NURS 4067','44208'),
	('NURS 4067 A','44205'),
	('NURS 4067 B','44206'),
	('NURS 4067 C','44207'),
	('NURS 4067 D','44208');

INSERT INTO UserGroupRelation (CWID, GroupName)
VALUES
	(11111111, 'NURS 4066 A'),
	(11111111, 'NURS 4066 B');

/* INSERT INTO Notifications (ToCWID, Title, Message)
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
	(99999999, 'Dummy User: Bran Stark', 'Bran is a semester 1 student'); */

INSERT INTO Events (EventID, LocationName, RoomName, Title, Description, StartTime, EndTime, CWID)
VALUES
	(0, 'Nursing Building', 'Lab 218', 'Medication Administration', '', '2018-03-13 08:00:00', '2018-03-13 09:00:00', 11111111),
	(1, 'Nursing Building', 'Lab 218', 'Medication Alternate Routes', '', '2018-03-13 09:00:00', '2018-03-13 10:00:00', 11111111),
	(2, 'Nursing Building', 'Lab 218', 'Sterile Dressing', '', '2018-03-13 10:00:00', '2018-03-13 12:00:00', 11111111),
	(3, 'Nursing Building', 'Lab 218', 'Practice Lab Sessions', 'Bring Practice Clothes!', '2018-03-16 09:30:00', '2018-03-16 12:00:00', 11111111),
	(4, 'Nursing Building', 'Lab 218', 'Blood Pressure', '', '2018-03-16 08:30:00', '2018-03-16 09:30:00', 11111111),
	(5, 'Nursing Building', 'Lab 218', 'Fluid and Electrolytes', '', '2018-03-15 09:00:00', '2018-03-15 12:00:00', 11111111),
	(6, 'Nursing Building', 'Lab 218', 'Vital Signs (TPR)', '', '2018-03-15 13:00:00', '2018-03-15 14:00:00', 12345678),
	(7, 'Nursing Building', 'Lab 218', 'Blood Pressure', '', '2018-03-15 14:00:00', '2018-03-15 15:00:00', 12345678),
	(8, 'Nursing Building', 'Lab 218', 'Medication Calculations Competency Exam', '', '2018-03-14 08:00:00', '2018-03-14 09:30:00', 12345678),
	(9, 'Nursing Building', 'Lab 218', 'Medication Transcription (MAR)', '', '2018-03-14 09:30:00', '2018-03-14 10:30:00', 12345678),
	(10, 'Nursing Building', 'Lab 218', 'Rest and Sleep', '', '2018-03-14 10:30:00', '2018-03-14 12:00:00', 12345678),
	(11, 'Nursing Building', 'Lab 218', 'Safety and Security', '', '2018-03-14 13:00:00', '2018-03-14 15:00:00', 12345678),
	(12, 'Nursing Building', 'Lab 218', 'Practice Medication', '', '2018-03-14 15:00:00', '2018-03-14 17:00:00', 12345678);
	
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