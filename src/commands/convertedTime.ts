import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { readUserTimezones, findUserIndex } from '../services/userTimezones';
import { DateTime } from 'luxon';

export const data = new SlashCommandBuilder()
  .setName('convertedtime')
  .setDescription('Converts the given time to the current user timezone')
  .addStringOption((option) =>
    option
      .setName('time')
      .setDescription('The time you want to convert (e.g., January 3, 2025 11:19 AM or 2319)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const timeInput = interaction.options.getString('time');
  if (!timeInput) {
    await interaction.editReply('Time cannot be null.');
    return;
  }

  const user = interaction.user;
  const userTimezones = readUserTimezones();
  const userIndex = findUserIndex(userTimezones, user.id);

  if (userIndex === -1) {
    await interaction.editReply('Please set your timezone first using /setusertimezone.');
    return;
  }

  const userTimezone = userTimezones[userIndex].timezone;
  let inputDateTime: DateTime;

  // Attempt to parse time in multiple formats
  if (/^\d{1,2}:\d{2}(\s?[APap][Mm])?$/.test(timeInput)) {
    // 12-hour format first
    inputDateTime = DateTime.fromFormat(timeInput.trim(), 'h:mm a', { zone: userTimezone });
    if (!inputDateTime.isValid) {
      // Then 24-hour format
      inputDateTime = DateTime.fromFormat(timeInput.trim(), 'HH:mm', { zone: userTimezone });
    }
  } else if (/^\d{4}$/.test(timeInput)) {
    // e.g., 2319
    inputDateTime = DateTime.fromFormat(timeInput.trim(), 'HHmm', { zone: userTimezone });
  } else {
    // e.g., "January 3, 2025 11:19 AM"
    inputDateTime = DateTime.fromFormat(timeInput.trim(), 'MMMM d, yyyy h:mm a', {
      zone: userTimezone,
    });
  }

  if (!inputDateTime.isValid) {
    await interaction.editReply(
      "Invalid date format. Please use 'January 3, 2025 11:19 AM' or a military time like '2319'."
    );
    return;
  }

  const unixTimestamp = Math.floor(inputDateTime.toSeconds());
  await interaction.editReply(`Converted time: <t:${unixTimestamp}:F>`);
}
