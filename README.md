# Webspejd: Check-in and -out system for Danish scout competition CCMR

This Node JS server hosts a website that handles check-in and -out of scout
patrols for the Danish scout competition [CCMR](https://ccmr.dk/). It can be
setup to handle any number of locations and groups as long as the groups are to
be checked in and out of locations in a predefined order. There can be one or
zero skippable locations between compulsory locations.

## Overview
This project includes Typescript source code for a Node JS server found within `src/`. Data about patrols and locations is put within `data/`.

When running, the server host multiple sites:
- a login page
- a check-in and out page for each location
- a master page that can see which check-in and -outs for all patrols on all locations

## Dependencies
* [NodeJS](https://nodejs.org)
* [TypeScript](https://www.typescriptlang.org/)

## Usage
1. Open the porject and run `npm install ` in root of project
2. Compile the project by running `npm run build` in root of project.
3. Run the server `npm run start`
4. Acces server at `localhost:3000`
These instructions are for windows only.
[Node](https://nodejs.org) must be installed on the hosting machine. 

**Tip**: To have the server accessible from the internet, use your local
ip-adresss as hostname. Setup port forwarding on your router to route any
incoming traffic on a chosen port (80 is standard for HTTP) to the hosting
machine on the port chosen within `server.js`. This wont work if you're behind
a NAT. See [this post](https://superuser.com/questions/1630106/how-do-i-find-out-if-my-isp-has-put-me-behind-a-nat-will-dynamic-dns-work-with)
to check if you're behind one. If you are, a tool like
[ngrok](https://ngrok.com/) can help you.

## Setup of data files
TBD
