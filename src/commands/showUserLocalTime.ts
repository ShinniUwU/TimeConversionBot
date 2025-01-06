import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { readUserTimezones, findUserIndex } from '../services/userTimezones';
import { DateTime } from 'luxon';

export const data = new SlashCommandBuilder()
  .setName('showuserlocaltime')
  .setDescription('Shows the local time of the user');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const user = interaction.user;
  const userTimezones = readUserTimezones();
  const userIndex = findUserIndex(userTimezones, user.id);

  if (userIndex === -1) {
    await interaction.editReply('Please set your timezone first using /setusertimezone.');
    return;
  }

  const userTimezone = userTimezones[userIndex].timezone;
  const currentTime = DateTime.now().setZone(userTimezone);
  const formattedTime = currentTime.toFormat('MMMM d, yyyy h:mm a');

  await interaction.editReply(formattedTime);
}
