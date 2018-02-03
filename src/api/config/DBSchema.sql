-- Drop the existing db and create an empty one

DROP DATABASE IF EXISTS nursing_calendar;
CREATE DATABASE nursing_calendar;

-- Create tables

USE nursing_calendar;

CREATE TABLE Locations
(
	LocationName VARCHAR(20) NOT NULL,
	PRIMARY KEY (LocationName)
);

CREATE TABLE Rooms
(
	RoomName VARCHAR(20) NOT NULL,
	Capacity SmallInt NOT NULL,
	LocationName VARCHAR(20) NOT NULL,
	PRIMARY KEY (RoomName),
	FOREIGN KEY (LocationName) REFERENCES Locations(LocationName)
);

CREATE TABLE Resources
(
	ResourceName VARCHAR(20) NOT NULL,
	PRIMARY KEY (ResourceName)
);

CREATE TABLE Events
(
	EventID INT NOT NULL,
	Title VARCHAR(20) NOT NULL,
	Description VARCHAR(300) NOT NULL,
	StartTime DateTime NOT NULL,
	EndTime DateTime NOT NULL,
	PRIMARY KEY (EventID)
);

CREATE TABLE Groups
(
	GroupName VARCHAR(20) NOT NULL,
	Description VARCHAR(300) NOT NULL,
	PRIMARY KEY (GroupName)
);

CREATE TABLE Users
(
	CWID SmallInt NOT NULL,
	FirstName VARCHAR(30) NOT NULL,
	LastName VARCHAR(30) NOT NULL,
	UserRole ENUM('student', 'instructor', 'administrator') NOT NULL,
	PRIMARY KEY (CWID)
);

CREATE TABLE Preferences
(
	CWID SmallInt NOT NULL,
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
	FromCWID SmallInt,	-- if NULL, notification is from sender
	ToCWID SmallInt NOT NULL,
	PRIMARY KEY (ID),
	FOREIGN KEY (FromCWID) REFERENCES Users(CWID),
	FOREIGN KEY (ToCWID) REFERENCES Users(CWID)
);

CREATE TABLE OverrideRequests
(
	ID INT NOT NULL,
	Message VARCHAR(300) NOT NULL,
	OwnerResponse VARCHAR(300) NOT NULL,
	AdminResponse VARCHAR(300) NOT NULL,
	Time DateTime NOT NULL,
	Accepted Boolean NOT NULL,
	EventID INT NOT NULL,
	RequestorCWID SmallInt NOT NULL,
	ResolvingAdminCWID SmallInt, -- if NULL, Admin has not yet resolved this
	PRIMARY KEY (ID),
	FOREIGN KEY (EventID) REFERENCES Events(EventID),
	FOREIGN KEY (RequestorCWID) REFERENCES Users(CWID),
	FOREIGN KEY (ResolvingAdminCWID) REFERENCES Users(CWID)
);

CREATE TABLE RoomResourceRelation
(
	Count SmallInt, -- if NULL, this resource isn't countable (example: AV capability)
	RoomName VARCHAR(20) NOT NULL,
	ResourceName VARCHAR(20) NOT NULL,
	PRIMARY KEY (RoomName, ResourceName),
	FOREIGN KEY (RoomName) REFERENCES Rooms(RoomName),
	FOREIGN KEY (ResourceName) REFERENCES Resources(ResourceName)
);

CREATE TABLE EventGroupRelation
(
	EventID INT NOT NULL,
	GroupName VARCHAR(20) NOT NULL,
	PRIMARY KEY (EventID, GroupName),
	FOREIGN KEY (EventID) REFERENCES Events(EventID),
	FOREIGN KEY (GroupName) REFERENCES Groups(GroupName)
);

CREATE TABLE UserGroupRelation
(
	CWID SmallInt NOT NULL,
	GroupName VARCHAR(20) NOT NULL,
	PRIMARY KEY (CWID, GroupName),
	FOREIGN KEY (CWID) REFERENCES Users(CWID),
	FOREIGN KEY (GroupName) REFERENCES Groups(GroupName)
);