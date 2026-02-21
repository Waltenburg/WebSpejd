# Webspejd: Check-in and -out system for Danish scout competitions

This Node JS server hosts a website that handles check-in and -out of scout
patrols for the Danish scout competitions [CCMR](https://ccmr.dk/), [Invictus](https://invictusloebet.dk/) and [Arcus](https://xn--arcuslbet-q8a.dk/). It can be
setup to handle any number of locations and patrols. Routes between locations control how patrols can move between locations. Thus, any competition where a patrols next location is known at check-out from the previous is supported. Locations may circle back on each other or be linearly ordered. 

## Overview
Webspejd is a small TypeScript/Node.js application for managing check‑in and ‑out of scout patrols during competitions. The TypeScript source code lives in the `src` folder and compiles to `target`. All state is stored in a single SQLite database, including locations, patrols, routes, and check‑in / ‑out events.

When running, the server host multiple sites:
- a login page
- a check-in and out page for each location
- Master page to manage locations, patrols and check‑ins / ‑outs

## Dependencies
* [NodeJS](https://nodejs.org)
* [TypeScript](https://www.typescriptlang.org/)

## Usage
1. Install [NodeJS](https://nodejs.org) if not already on system.
2. Run `npm install` in root of project
3. Compile the project by running `npm run build` in root of project.
4. Setup configuration file and database as described in [Setup of server](##setup-of-server)
4. Run the server `npm run start`
5. Acces server at the address and port set in configuration file.

## Setup of server
Before the server can be started, a configuration file must be created and the database must be created.

### Configuration file
A configuration file named `server.config.json` must be created in the root of the project. An example configuration file is shown below.

```json
{
    "port": 3000,
    "address": "127.0.0.1",
    "databasePath": "SQLite/webspejd.db",
    "assetsPath": "assets/",
    "inMemory": false,
    "resetDatabase": false,
    "master_password": "example_password"
}
```
The configuration file contains the following settings:
- `port`: The port the server listens on.
- `address`: The address the server listens on. Use `"localhost"` or `127.0.0.1` for local access. Use the computer's IP address for network access.
- `databasePath`: The path to the SQLite database file.
- `assetsPath`: The path to the assets folder containing images, CSS and JS files. Usually this is set to `assets/`.
- `inMemory`: If true, the database is created in memory and not saved to disk. Useful for testing.
- `resetDatabase`: If true, the database is reset on server start. Useful for testing
- `master_password`: The master password used to access the master page.

### Setup of database
To create the database run `npm run generateDatabase` if project is build or `npm run generateDatabase:ts` if source is used. This generates SQLite at the location set in configuration file with correct tables and settings.
