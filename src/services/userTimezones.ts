import fs from 'fs';

interface UserTimezone {
  "user.id": string;
  timezone: string;
}

const FILE_PATH = './usertimezones.json';

/**
 * Reads user timezone data from the JSON file.
 */
export function readUserTimezones(): UserTimezone[] {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading user timezones:', err);
    return [];
  }
}

/**
 * Writes the provided user timezone data to the JSON file.
 */
export function writeUserTimezones(timezones: UserTimezone[]): void {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(timezones, null, 2));
  } catch (err) {
    console.error('Error writing user timezones:', err);
  }
}

/**
 * Finds the index of a user in the timezones array by user.id.
 */
export function findUserIndex(userTimezones: UserTimezone[], userId: string): number {
  return userTimezones.findIndex((data) => data["user.id"] === userId);
}
