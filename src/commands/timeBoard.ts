import { SlashCommandBuilder, ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import {EmbedBuilder} from 'discord.js'
import { readUserTimezones } from '../services/userTimezones';
import { DateTime } from 'luxon';

export const data = new SlashCommandBuilder()
  .setName('timeboard')
  .setDescription('Shows a table containing the timezone of all the users, which have set their timezone')


export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
    const timeboard = new EmbedBuilder()
    .setTitle('Timeboard')
    .setTimestamp()

  const userTimezones = readUserTimezones();

  //Clears the whole timeboard (fixing an issue of repeatedly adding users everytime someone uses the command)
  for (let i = 0; i < userTimezones.length; i++) {
    await timeboard.spliceFields(0, userTimezones.length);
    }

  //Adds every unique user to the timeboard
  for (const entry of userTimezones) {
    const currentTime = DateTime.now().setZone(entry.timezone);
    const formattedTime = currentTime.toFormat("MMMM d, yyyy h:mm a");

    //Finds the displayname of each member in the list
    let displayName = `<@${entry["user.id"]}>`;
    let guildMember = interaction.guild?.members.cache.get(entry["user.id"]);

    if (!guildMember) {
        guildMember = await interaction.guild?.members.fetch(entry["user.id"]);
      }
    
    if(guildMember) {
        displayName = guildMember.displayName || guildMember.user.username;
      }

    timeboard.addFields({
      name: displayName,
      value: formattedTime,
      inline: false,
    });
  }
  
  //Displays the embed of the timeboard
  interaction.editReply({ embeds: [timeboard] });
}
