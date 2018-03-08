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
	(22222222, 'Admin', 'McAdminFace', 'administrator');

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
	('Second Floor', null, 'Glenwood');

INSERT INTO Resources (ResourceName, IsEnumerable)
VALUES
	('Clinicals', false),
	('Beds', true),
	('Audio/Video', false);

INSERT INTO RoomResourceRelation (LocationName, RoomName, ResourceName, Count)
	VALUES
		('Nursing Building', 'Room 1', 'Beds', 10),
		('Nursing Building', 'Room 1', 'Audio/Video', null),
		('Nursing Building', 'Room 2', 'Audio/Video', null),
		('Nursing Building', 'Room 3', 'Audio/Video', null),
		('St. Francis', 'First Floor', 'Clinicals', null),
		('St. Francis', 'Second Floor', 'Clinicals', null),
		('Glenwood', 'First Floor', 'Clinicals', null),
		('Glenwood', 'Second Floor', 'Clinicals', null);

INSERT INTO Groups (GroupName, Description)
VALUES
	('Level 1', 'All Level 1 Students'),
	('Level 2', 'All Level 2 Students'),
	('Level 3', 'All Level 3 Students'),
	('Level 4', 'All Level 4 Students'),
	('Level 5', 'All Level 5 Students'),
	('Anatomy and Physiology', 'The body and diseases'),
	('Gerontology', 'Aging processes and treatments'),
	('Nursing Research', 'Researching techniques'),
	('Med Surg Clinicals', 'Med Surg Clinicals'),
	('Pediatrics Clinicals', 'Pediatrics Clinicals'),
	('Maternity Clinicals', 'Maternity Clinicals'),
	('Med Surg - Rotation 1', 'First clinical rotation group'),
	('Med Surg - Rotation 2', 'Second clinical rotation group');

INSERT INTO UserGroupRelation (CWID, GroupName)
VALUES
	(00000000, 'Level 2'),
	(11111111, 'Anatomy and Physiology'),
	(00000000, 'Nursing Research'),
	(00000000, 'Med Surg Clinicals'),
	(00000000, 'Med Surg - Rotation 1'),
	(11111111, 'Maternity Clinicals');

INSERT INTO Notifications (ToCWID, Title, Message)
VALUES
	(00000000, 'Message to Students', 'This is a very important message.'),
	(00000000, 'Regarding Nursing Research...', 'Hello. This is God speaking. Plz write.'),
	(22222222, 'Admin Message', 'This is a very important message.'),
	(22222222, 'Med Surg Clinicals', 'This is a very important message.');