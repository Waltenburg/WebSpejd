-- Locations
CREATE TABLE post (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  open BOOLEAN NOT NULL DEFAULT 1,
  next_post INTEGER NOT NULL,
  detour INTEGER DEFAULT NULL
);

-- Patrols
CREATE TABLE patrol (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  udgået BOOLEAN NOT NULL DEFAULT 0
);

-- Users
CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  postId INTEGER REFERENCES post(id),
  password TEXT NOT NULL
);

-- Routes between locations
-- CREATE TABLE route (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   from_location_id INTEGER NOT NULL,
--   to_location_id INTEGER NOT NULL,
--   FOREIGN KEY (from_location_id) REFERENCES location(id),
--   FOREIGN KEY (to_location_id) REFERENCES location(id)
-- );

-- Check-ins (patrols checking in at locations)
CREATE TABLE checkin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patrolId INTEGER NOT NULL,
  postId INTEGER NOT NULL,
  type INTEGER NOT NULL,
  timeStr INTEGER DEFAULT (datetime('now')) NOT NULL,
  --target_location_id INTEGER NOT NULL,
  FOREIGN KEY (patrolId) REFERENCES patrol(id),
  FOREIGN KEY (postId) REFERENCES post(id)
  --FOREIGN KEY (target_location_id) REFERENCES location(id)
);

-- Patrols' latest status
-- CREATE TABLE patrol_status (
--   patrol_id INTEGER PRIMARY KEY,
--   latest_checkin_id INTEGER,
--   FOREIGN KEY (patrol_id) REFERENCES patrol(id),
--   FOREIGN KEY (latest_checkin_id) REFERENCES checkin(id)
-- );

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- CREATE TRIGGER update_patrol_status_after_checkin
-- AFTER INSERT ON checkin
-- BEGIN
--     INSERT INTO patrol_status (patrol_id, latest_checkin_id)
--     VALUES (NEW.patrol_id, NEW.id)
--     ON CONFLICT(patrol_id) DO UPDATE SET latest_checkin_id = NEW.id;
-- END;
