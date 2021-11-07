const path = require("path");
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command',
	category: 'Everyone',
	async execute(message, args) {

		const data = [];
		const { commands } = message.client;

		const guild = await models.Guild.findOne({
			where: {
				discord_guild_id: message.guild.id
			}
		});

		const prefix = (guild) ? guild.prefix : '!';

		if (!args.length) {
			message.delete();
			data.push('Here\'s a list of all my commands:');

			const commandList = {};

			for(var command of commands) {
				var category = command[1].category;
				var desc = '**' + prefix + command[1].name + '**: ' + command[1].description
				if(!commandList.hasOwnProperty(category)) {
					commandList[category] = [];
					commandList[category].push(desc);
				} else {
					commandList[category].push(desc);
				}
			}

			for(var group in commandList) {
				data.push(':small_blue_diamond: **__Commands for ' + group + '__**');
				data.push(commandList[group].join("\n") + "\n");
			}

			data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);
			return message.channel.send(data, { split: true });
		}

		let name = args[0].toLowerCase().replace(prefix, '');
		let retrievedCommand = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!retrievedCommand) {
			return message.reply('that\'s not a valid command!');
		}

		data.push(`**Name:** ${retrievedCommand.name}`);

		if (retrievedCommand.description) data.push(`**Description:** ${retrievedCommand.description}`);
		if (retrievedCommand.usage) data.push(`**Usage:** ${retrievedCommand.usage.replaceAll('_PREFIX_', prefix)}`);

		message.channel.send(data, { split: true });

	},
};
