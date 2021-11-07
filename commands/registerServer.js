const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'registerserver',
	description: 'Lets you register your server in the system',
	category: 'Everyone',
	usage: 'Lets you register your server in the system',
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

        const answers = {
        	name: null,
        	description: false,
        	invite_url: null,
        	prefix: null
        };

        // check the guild is not already registered
        const guild = await models.Guild.findOne({
			where: {
				discord_guild_id: message.guild.id
			}
		});

		if(guild) {
			await message.reply('This server is already registered with the bot!')
      		return;
		}

  		try {

  			await message.channel.send(`**What is the name of your server?**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.name = collected.first().content;
				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

			await message.channel.send(`**Provide a brief description of the server**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.description = collected.first().content;
				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

			await message.channel.send(`**Paste an invite URL link**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.invite_url = collected.first().content;
				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

			await message.channel.send(`**What prefix would you like to use?**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.prefix = collected.first().content;
				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

		} catch(e) {
			await message.channel.send('Something went wrong with the server registration process. Please try again.');
			return;
		}

		const newGuild = await models.Guild.build({
		    discord_guild_id: message.guild.id,
		    name: answers.name,
		    description: answers.description,
		    invite_url: answers.invite_url,
		    prefix: answers.prefix,
		    owner_discord_id: message.author.id
		}).save();

		await message.reply(`:ballot_box_with_check: Your server is now registered, it takes a minute or two for commands to become available!`);

	},
};