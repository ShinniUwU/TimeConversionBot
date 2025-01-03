import { REST, Routes } from 'discord.js';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { TOKEN, CLIENT_ID } from './config';
import luxon, { DateTime } from 'luxon';
import fs from 'fs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const rest = new REST({ version: '10' }).setToken(TOKEN!);
const commands = [
    {
        name: 'currenttime',
        description: "Responds with current time!",
    },
    {
        name: 'convertedtime',
        description: "Converts the given time to the current user timezone",
        options: [
            {
                name: 'time',
                type: 3,
                description: 'The time you want to convert (e.g., January 3, 2025 11:19 AM or 2319)',
                required: true,
            },
        ],
    },
    {
        name: `showuserlocaltime`,
        description: "Shows the local time of the user",
    },
    {
        name: `setusertimezone`,
        description: "Sets your current personal timezone, used when converting the time",
        options: [
            {
                name: 'timezone',
                type: 3,
                description: 'The timezone you want to set',
                required: true,
            },
        ],
    },
];

try {
    console.log("started refreshing application (/) commands");
    await rest.put(Routes.applicationCommands(CLIENT_ID!), { body: commands });
    console.log("Successfully reloaded application (/) commands");
} catch (err) {
    console.error(err);
}

client.on(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Defer the reply immediately
    await interaction.deferReply();

    try {
        const { commandName, options, user } = interaction;

        if (commandName === "currenttime") {
            const currentTime = Math.floor(Date.now() / 1000);
            await interaction.editReply(`<t:${currentTime}:F>`);
        }

        if (commandName === 'convertedtime') {
            const timeInput = options.getString('time');
            if (timeInput === null) {
                await interaction.editReply("Time cannot be null.");
                return; // Exit early
            }

            // Read user timezone from JSON file
            let userData: { "user.id": string; "timezone": string }[] = [];
            try {
                const data = fs.readFileSync('./usertimezones.json', 'utf-8');
                userData = JSON.parse(data);
            } catch (err) {
                console.error(err);
                await interaction.editReply("Failed to read user data.");
                return; // Exit early
            }

            const userIndex = userData.findIndex((data) => data["user.id"] === user.id);
            if (userIndex === -1) {
                await interaction.editReply("Please set your timezone first using /setusertimezone.");
                return; // Exit early
            }

            const userTimezone = userData[userIndex].timezone;

            // Parse input time in civilian or military format
            let inputDateTime;
            if (/^\d{1,2}:\d{2}(?:\s?[AP]M)?$/.test(timeInput)) { // Military or civilian time format
                inputDateTime = DateTime.fromFormat(timeInput.trim(), "h:mm a", { zone: userTimezone });
                if (!inputDateTime.isValid) {
                    inputDateTime = DateTime.fromFormat(timeInput.trim(), "HH:mm", { zone: userTimezone });
                }
            } else if (/^\d{4}$/.test(timeInput)) { // Military time format without colon
                inputDateTime = DateTime.fromFormat(timeInput.trim(), "HHmm", { zone: userTimezone });
            } else { // Civilian format with date
                inputDateTime = DateTime.fromFormat(timeInput.trim(), "MMMM d, yyyy h:mm a", { zone: userTimezone });
            }

            if (!inputDateTime.isValid) {
                await interaction.editReply("Invalid date format. Please use either 'January 3, 2025 11:19 AM' or military time like '2319'.");
                return; // Exit early
            }

            // Get Unix timestamp
            const unixTimestamp = Math.floor(inputDateTime.toSeconds()); // Convert to seconds

            await interaction.editReply(`Converted time: <t:${unixTimestamp}:F>`);
        }

        if (commandName === "showuserlocaltime") {
            let userData: { "user.id": string; "timezone": string }[] = [];
            try {
                const data = fs.readFileSync('usertimezones.json', 'utf-8');
                userData = JSON.parse(data);
            } catch (err) {
                console.error(err);
                userData = [];
            }

            const index = userData.findIndex((data) => data["user.id"] === user.id);
            if (index === -1) {
                await interaction.editReply("Please set your timezone first using /setusertimezone");
                return; // Exit early
            }

            const timer = DateTime.now().setZone(userData[index].timezone);
            const formattedTime = timer.toFormat('MMMM d, yyyy h:mm a');
            await interaction.editReply(`${formattedTime}`);
        }

        if (commandName === "setusertimezone") {
            const timezone = options.getString('timezone');
            if (!timezone) {
                await interaction.editReply("Timezone cannot be null.");
                return; // Exit early
            }

            let userData: { "user.id": string; "timezone": string }[] = [];
            try {
                const data = fs.readFileSync('usertimezones.json', 'utf-8');
                userData = JSON.parse(data);
            } catch (err) {
                console.error(err);
                userData = [];
            }

            const existingUserIndex = userData.findIndex((data) => data["user.id"] === user.id);

            if (existingUserIndex !== -1) {
                userData[existingUserIndex].timezone = timezone;
                fs.writeFileSync('usertimezones.json', JSON.stringify(userData, null, 2));
                await interaction.editReply(`Your timezone has been updated to: ${timezone}`);
            } else {
                userData.push({ "user.id": user.id, "timezone": timezone });
                fs.writeFileSync('usertimezones.json', JSON.stringify(userData, null, 2));
                await interaction.editReply(`Your timezone has been set to: ${timezone}`);
            }
        }
    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.editReply("An error occurred while processing your request.");
        }
    }
});

function isValidDateTime(input: string): boolean {
    const regex = /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4} \d{1,2}:\d{2} ?([AP]M)?$/;
    return regex.test(input);
}

client.login(process.env.TOKEN);
