import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { readUserTimezones, writeUserTimezones, findUserIndex } from '../services/userTimezones';

export const data = new SlashCommandBuilder()
  .setName('setusertimezone')
  .setDescription('Sets your current personal timezone, used when converting the time')
  .addStringOption((option) =>
    option
      .setName('timezone')
      .setDescription('The timezone you want to set (e.g., America/New_York)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const timezone = interaction.options.getString('timezone');
  if (!timezone) {
    await interaction.editReply('Timezone cannot be null.');
    return;
  }

  const user = interaction.user;
  const userTimezones = readUserTimezones();
  const existingUserIndex = findUserIndex(userTimezones, user.id);

  if (existingUserIndex !== -1) {
    userTimezones[existingUserIndex].timezone = timezone;
  } else {
    userTimezones.push({ "user.id": user.id, timezone });
  }

  writeUserTimezones(userTimezones);
  await interaction.editReply(`Your timezone has been set to: ${timezone}`);
}
