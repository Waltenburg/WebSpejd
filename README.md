# Webspejd: Check-in and -out system for Danish scout competition CCMR
WARNING: There are, at the moment, critical errors related to manual check-in and -out from the master page.
--
This Node JS server host a website that handles check-in and -out of scout patrols for the Danish scout competition [CCMR](https://ccmr.dk/). It can be setup to handle any number of locations and groups as long as the groups are to be checked in and out of locations in a predefined order. There can be one or zero skippable locations between compulsory locations.
## Overview
This project includes both Typescript source code along with the *compiled* JavaScript code for a Node JS server. Typescript is found within the folder `Development` whilst JavaScript and data is found within `Deployed`.  When running, the server host multiple sites:
- a login page
- a check-in and out page for each location
- a master page that can see which check-in and -outs for all patrols on all locations
# Usage
These instructions are for windows only.
[Node](https://nodejs.org) must be installed on the hosting machine. Once installed, starting the server is trivial.
1. Open `server.js` and set `hostname` and `port` to desired values.
	- Use `localhost` (ip: `127.0.0.1`) to have it accessible from the host machine. 
	- `port` can be anything. `3000` is usually available.
2. Open command prompt from the projects root folder
3. Run `noder server.js`. This starts server and prints information about the patrols and locations loaded along with the url the server is hosted on.
4. Open the printed url in a browser.
**Tip**: Both login-page and location-pages are developed solely for phones. When developing or using on computer, it is therefore recommended to select a phone device under development options within the browser.
**Tip**: To have the server accessible from the internet, use your local ip-adresss as hostname. Setup port forwarding on your router to route any incoming traffic on a chosen port (80 is standard for HTTP) to the hosting machine on the port chosen within `server.js`. This wont work if you're behind a NAT. See [this post](https://superuser.com/questions/1630106/how-do-i-find-out-if-my-isp-has-put-me-behind-a-nat-will-dynamic-dns-work-with) to check if you're behind one. If you are, a tool like [ngrok](https://ngrok.com/) can help you.
## Setup of data files
At the moment, setup must be done manually by editing a few JSON files located in`Deployed/data`. The files are:

| File            | Information within                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loeb.JSON`     | All patrols and whether they are still active                                                                                                     |
| `poster.JSON`   | Locations                                                                                                                                         |
| `users.JSON`    | Login information along with passwords for each location                                                                                          |
| `ppMatrix.JSON` | Check-in and -out times for all patrols on all locations.<br>If not present when server starts, it is created with all patrols on first location. |
