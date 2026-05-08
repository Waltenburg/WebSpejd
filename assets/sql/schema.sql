-- Locations
CREATE TABLE Location (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  open BOOLEAN NOT NULL DEFAULT 1
);

-- Routes between locations
CREATE TABLE Route (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromLocationId INTEGER NOT NULL,
  toLocationId INTEGER NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT 1,
  distance REAL,
  CONSTRAINT fk_fromLocationId FOREIGN KEY (fromLocationId) REFERENCES Location(id),
  CONSTRAINT fk_toLocationId FOREIGN KEY (toLocationId) REFERENCES Location(id),
  CONSTRAINT uniqueRoutePar UNIQUE (fromLocationId, toLocationId)
);

-- Patrols
CREATE TABLE Patrol (
  id INTEGER PRIMARY KEY,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  udgået BOOLEAN NOT NULL DEFAULT 0,

  CONSTRAINT uniqueNumberAndName UNIQUE (number, name)
);

-- Users
CREATE TABLE User (
  id INTEGER PRIMARY KEY,
  locationId INTEGER NOT NULL,
  password TEXT NOT NULL,

  CONSTRAINT fk_locationId FOREIGN KEY (locationId) REFERENCES Location(id)
);

-- Check-ins and -outs of patrols
CREATE TABLE PatrolUpdates ( 
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patrolId INTEGER NOT NULL,
  currentLocationId INTEGER NOT NULL,
  targetLocationId INTEGER NOT NULL,
  timeStr INTEGER DEFAULT (datetime('now')) NOT NULL,

  CONSTRAINT fk_patrolId FOREIGN KEY (patrolId) REFERENCES Patrol(id),
  CONSTRAINT fk_currentLocationId FOREIGN KEY (currentLocationId) REFERENCES Location(id),
  CONSTRAINT fk_targetLocationId FOREIGN KEY (targetLocationId) REFERENCES Location(id)
);

-- View to get the latest update of each patrol
CREATE VIEW LatestPatrolUpdates AS
SELECT pu1.*
FROM PatrolUpdates pu1
WHERE pu1.timeStr = (
    SELECT MAX(pu2.timeStr)
    FROM PatrolUpdates pu2
    WHERE pu2.patrolId = pu1.patrolId
);

-- Settings key-value store
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE Logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    method TEXT,
    path TEXT,
    headers TEXT,
    duration INTEGER,
    status INTEGER,
    severity TEXT,
    message TEXT
);

CREATE INDEX idx_logs_time ON Logs(time);
CREATE INDEX idx_logs_severity ON Logs(severity);
CREATE INDEX idx_logs_status ON Logs(status);