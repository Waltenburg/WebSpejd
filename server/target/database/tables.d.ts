export declare const enum PATROL_UPDATE_TABLE {
    TABLE_NAME = "PatrolUpdates",
    ID = "id",
    PATROL_ID = "patrolId",
    CURRENT_LOCATION_ID = "currentLocationId",
    TARGET_LOCATION_ID = "targetLocationId",
    TIME_STR = "timeStr",
    LATEST_UPDATE_VIEW = "LatestPatrolUpdates"
}
export declare const enum LOCATION_TABLE {
    TABLE_NAME = "Location",
    ID = "id",
    NAME = "name",
    TEAM = "team",
    OPEN = "open"
}
export declare const enum ROUTE_TABLE {
    TABLE_NAME = "Route",
    ID = "id",
    FROM_LOCATION_ID = "fromLocationId",
    TO_LOCATION_ID = "toLocationId",
    IS_OPEN = "is_open",
    DISTANCE = "distance"
}
export declare const enum PATROL_TABLE {
    TABLE_NAME = "Patrol",
    ID = "id",
    NAME = "name",
    UDGAET = "udg\u00E5et"
}
export declare const enum USER_TABLE {
    TABLE_NAME = "User",
    ID = "id",
    LOCATION_ID = "locationId",
    PASSWORD = "password"
}
export declare const enum SETTINGS_TABLE {
    TABLE_NAME = "settings",
    KEY = "key",
    VALUE = "value",
    SETTING_MASTER_PASSWORD = "master_password",
    SETTING_FIRST_LOCATION_ID = "first_location"
}
