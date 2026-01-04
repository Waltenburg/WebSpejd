export const enum PATROL_UPDATE_TABLE {
    TABLE_NAME = "PatrolUpdates",
    ID = "id",
    PATROL_ID = "patrolId",
    CURRENT_LOCATION_ID = "currentLocationId",
    TARGET_LOCATION_ID = "targetLocationId",
    TIME_STR = "timeStr",
    LATEST_UPDATE_VIEW = "LatestPatrolUpdates"
}

export const enum LOCATION_TABLE {
    TABLE_NAME = "Location",
    ID = "id",
    NAME = "name",
    TEAM = "team",
    OPEN = "open"
}

export const enum ROUTE_TABLE {
    TABLE_NAME = "Route",
    ID = "id",
    FROM_LOCATION_ID = "fromLocationId",
    TO_LOCATION_ID = "toLocationId",
    IS_OPEN = "is_open",
    DISTANCE = "distance"
}

export const enum PATROL_TABLE {
    TABLE_NAME = "Patrol",
    ID = "id",
    NAME = "name",
    UDGAET = "udgået"
}

export const enum USER_TABLE {
    TABLE_NAME = "User",
    ID = "id",
    LOCATION_ID = "locationId",
    PASSWORD = "password"
}

export const enum SETTINGS_TABLE {
    TABLE_NAME = "settings",
    KEY = "key",
    VALUE = "value",

    SETTING_MASTER_PASSWORD = "master_password",
    SETTING_FIRST_LOCATION_ID = 'first_location'
}
