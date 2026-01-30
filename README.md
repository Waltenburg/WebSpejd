# Webspejd: Check-in and -out system for Danish scout competitions

This Node JS server hosts a website that handles check-in and -out of scout
patrols for the Danish scout competition [CCMR](https://ccmr.dk/), [Invictus](https://invictusloebet.dk/) and [Arcus](https://xn--arcuslbet-q8a.dk/). It can be
setup to handle any number of locations and patrols. Routes between locations control how patrols can move between locations. Thus, any competition where a patrols next location is known at check-out from the previous is supported. Locations may circle back on each other or be linearly ordered. 

## Overview
This project includes Typescript source code for a Node JS server found within `src`. All data is stored within an SQLite database that has to be created before starting the server. See [Setup of database](##setup-of-database) for instructions on how to do this.

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
5. Acces server at `localhost:3000`
These instructions are for windows only. 

**Tip**: To have the server accessible from the internet, use your local
ip-adresss as hostname. Setup port forwarding on your router to route any
incoming traffic on a chosen port (80 is standard for HTTP) to the hosting
machine on the port chosen within `server.js`. This wont work if you're behind
a NAT. See [this post](https://superuser.com/questions/1630106/how-do-i-find-out-if-my-isp-has-put-me-behind-a-nat-will-dynamic-dns-work-with)
to check if you're behind one. If you are, a tool like
[ngrok](https://ngrok.com/) can help you.

## Setup of database
** This part needs to be updated **
