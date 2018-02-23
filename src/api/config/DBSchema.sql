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
	LocationName VARCHAR(20) NOT NULL,
	PRIMARY KEY (LocationName)
);

CREATE TABLE Rooms
(
	RoomName VARCHAR(20) NOT NULL,
	Capacity SmallInt, -- if NULL, room should be regarded as having infinite capacity
	LocationName VARCHAR(20) NOT NULL,
	PRIMARY KEY (RoomName, LocationName),
	FOREIGN KEY (LocationName) REFERENCES Locations(LocationName)
);

CREATE TABLE Resources
(
	ResourceName VARCHAR(20) NOT NULL,
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
	LocationName VARCHAR(20) NOT NULL,
	RoomName VARCHAR(20) NOT NULL,
	Title VARCHAR(20) NOT NULL,
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
	GroupName VARCHAR(20) NOT NULL,
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
	ID INT NOT NULL,
	Title VARCHAR(20) NOT NULL,
	Message VARCHAR(300) NOT NULL,
	SendTime DateTime NOT NULL,
	HasBeenSeen Boolean NOT NULL,
	FromCWID INT,	-- if NULL, notification is from sender
	ToCWID INT NOT NULL,
	PRIMARY KEY (ID),
	FOREIGN KEY (FromCWID) REFERENCES Users(CWID),
	FOREIGN KEY (ToCWID) REFERENCES Users(CWID)
);

CREATE TABLE OverrideRequests
(
	EventID INT NOT NULL,
	Message VARCHAR(300) NOT NULL,
	OwnerResponse VARCHAR(300),
	AdminResponse VARCHAR(300),
	Time DateTime NOT NULL,
	Accepted Boolean NOT NULL,
	RequestorCWID INT NOT NULL,
	ResolvingAdminCWID INT, -- if NULL, Admin has not yet resolved this
	PRIMARY KEY (EventID),
	FOREIGN KEY (EventID) REFERENCES Events(EventID),
	FOREIGN KEY (RequestorCWID) REFERENCES Users(CWID),
	FOREIGN KEY (ResolvingAdminCWID) REFERENCES Users(CWID)
);

CREATE TABLE RoomResourceRelation
(
	LocationName VARCHAR(20) NOT NULL,
	RoomName VARCHAR(20) NOT NULL,
	ResourceName VARCHAR(20) NOT NULL,
	Count SmallInt, -- if NULL, this resource isn't countable (example: AV capability)
	PRIMARY KEY (LocationName, RoomName, ResourceName),
	FOREIGN KEY (LocationName) REFERENCES Locations(LocationName),
	FOREIGN KEY (RoomName) REFERENCES Rooms(RoomName),
	FOREIGN KEY (ResourceName) REFERENCES Resources(ResourceName)
);

CREATE TABLE EventGroupRelation
(
	EventID INT NOT NULL,
	GroupName VARCHAR(20) NOT NULL,
	PRIMARY KEY (EventID, GroupName),
	FOREIGN KEY (EventID) REFERENCES Events(EventID)
);

CREATE TABLE UserGroupRelation
(
	CWID INT NOT NULL,
	GroupName VARCHAR(20) NOT NULL,
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
