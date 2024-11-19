import * as fs from 'fs';

const debugging = true;

const patruljeLogWriteStream = fs.createWriteStream("data/patruljeLog.txt", {flags:'a'})
const serverLogWriteStream = fs.createWriteStream("data/serverLog.txt", {flags:'a'});

let lastUpdates: string[] = ["", "", "", "", "", ""];
let lastUpdatesIndex: number = 0;
const numberOfLogsToKeep = 6;


/**
 * Print log message.
 *
 * @param message the message to print
 */
export const log = (message: any) => {
    console.log(message);
}

/**
 * Print debug message.
 *
 * @param message the message to print
 */
export const debug = (message: any) => {
    if(!debugging) {
        return;
    }
    if(typeof message === "string") {
        log(`DEBUG ${message}`);
    } else {
        log(message);
    }
}

/**
 * Write log message to server log.
 *
 * @param message the message to log
 */
export const writeToServerLog = (message: string) => {
    serverLogWriteStream.write("\n" + getTimeString() + " - " + message)
}

/**
 * Write log message to patrol log.
 *
 * @param message the message to log
 */
export const writeToPatrolLog = (message: string) => {
    const messageWithTimestamp = getTimeString() + " - " + message;
    patruljeLogWriteStream.write(messageWithTimestamp + "\n");
    addToLastUpdates(messageWithTimestamp);
}

export const getNewUpdates = (): string[] => {
    return lastUpdates;
}

/**
 * Create formatted time string.
 *
 * @param date the date to format
 * @returns formatted time string
 */
const getTimeString = (date?: Date): string => {
    if(date == undefined) {
        date = new Date()
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

const addToLastUpdates = (update: string): void => {
    lastUpdates.push(update);
    lastUpdatesIndex++;
    if(lastUpdates.length > numberOfLogsToKeep) {
        lastUpdates.shift();
    }
}
