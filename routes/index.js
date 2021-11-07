const fs = require('fs');
const path = require("path");
const express = require('express');
const router = express.Router();
const models  = require(path.join(process.cwd(), 'db', 'models'));
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const moment = require('moment');
const Discord = require('discord.js');


const client = new Discord.Client({ 
    // ws: { 
    //     intents: [
    //         // 'GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 
    //         // 'GUILD_PRESENCES', 'GUILD_MEMBERS','GUILD_VOICE_STATES', 'GUILD_MESSAGE_REACTIONS'
    //     ] 
    // }, 
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'] 
});

client.usedStatsCommandRecently = new Set();
client.commands = new Discord.Collection();

const getAllCommandFiles = function(dirPath, commandFiles) {
	files = fs.readdirSync(dirPath);
    commandFiles = commandFiles || [];

	files.forEach(function(file) {
		if (fs.statSync(dirPath + "/" + file).isDirectory()) {
		  	commandFiles = getAllCommandFiles(dirPath + "/" + file, commandFiles)
		} else {
			if(file.endsWith('.js')) {
				commandFiles.push(path.join(dirPath, '/', file));
			}
		}
	});
  	return commandFiles;
} 

const commandFiles = getAllCommandFiles('./commands');
for (var file of commandFiles) {
	const command = require(`./../${file}`);
	client.commands.set(command.name, command);
}

const guilds = {};
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const guildResults = await models.Guild.findAll();
	guildResults.map(guild => {
		guilds[guild.discord_guild_id] = guild.prefix;
	});
});

/**
 * Periodically update the list of guilds
 */
setInterval(async function() {
	const guildResults = await models.Guild.findAll();
	guildResults.map(guild => {
		guilds[guild.discord_guild_id] = guild.prefix;
	});
}, 60000)

client.on('message', async message => {

	const guildId = message.guild.id;
	const prefix = (guilds.hasOwnProperty(guildId)) ? guilds[guildId] : '!';
	
    if (!message.content.startsWith(prefix) || message.author.bot) return;
	const args = message.content.slice(1).split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) {
		message.reply("Sorry, I don't know how to handle that command!");
		return;
	}

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('There was an error trying to execute that command!');
	}
});

if(config.env === 'staging') {
    client.login(config.discord_token_staging);
} else {
    client.login(config.discord_token);
}

module.exports = router;
