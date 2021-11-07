const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const Discord = require('discord.js');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'queues',
	description: 'Lets your view all active queues',
	category: 'Everyone',
	usage: `Lets your view all active queues. If you call this command with the 'all' argument, e.g.  \`_PREFIX_queues all\` it will show all queues, not just ones created on this Discord server`,
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Please call me from the Slips discord.');
      		return;
    	}

    	// get guild prefix
    	const guild = await models.Guild.findOne({
			where: {
				discord_guild_id: message.guild.id
			}
		});

		const prefix = (guild) ? guild.prefix : '!';


		// get queues
    	const whereClause = {
    		status: {
    			[Op.in]: ['created', 'in_progress']
    		}
    	}

    	const allServers = (args.length > 0);
    	if(!allServers) {
    		whereClause.discord_guild_id = message.guild.id
    	}

	    const allQueues = await models.Queue.findAll({
	    	where: whereClause
	    });

	    // display queues
	    for(var queue of allQueues) {

	    	let guildServer = await models.Guild.findOne({ where: { discord_guild_id: queue.discord_guild_id }});
	    	if(!guildServer) {
	    		guildServer = {
	    			name: 'Unknown Server'
	    		}
	    	}

	    	let queueParticipantsMsg = '';
	    	let queueParticipants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});

	    	if(queueParticipants.length > 0) {
	    		for(var participant of queueParticipants) {
	    			let player = await models.Player.findByPk(participant.player_id);
	    			switch(queue.type) {
	    				case '6mans':
	    					queueParticipantsMsg += `<@${player.discord_id}> (${player.standard_elo_mmr})\n`;
	    					break;
	    				case '4mans':
	    					queueParticipantsMsg += `<@${player.discord_id}> (${player.doubles_elo_mmr})\n`;
	    					break;
	    				case '2mans':
	    					queueParticipantsMsg += `<@${player.discord_id}> (${player.duel_elo_mmr})\n`;
	    					break;
	    			}
	    		}
	    	} else {
	    		queueParticipantsMsg = 'Empty';
	    	}

	    	const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(queue.identifier)
				.setDescription(`Created on **${guildServer.name}**`)
				.addFields(
					{ name: 'Type', value: queue.type, inline: true },
					{ name: 'Selection Mode', value: queue.game_mode, inline: true },
					{ name: 'Status', value: queue.status, inline: true },
					{ name: 'Queue Participants', value: queueParticipantsMsg },
				)
				.setFooter(`To join this queue: ${prefix}jq ${queue.identifier}\nTo place a bet on this queue: ${prefix}placebet ${queue.identifier}`);

			await message.channel.send(embed);
	    }

	    if(allQueues.length === 0) {

	    	const guild = await models.Guild.findOne({
				where: {
					discord_guild_id: message.guild.id
				}
			});

			const prefix = (guild) ? guild.prefix : '!';

	    	await message.channel.send(`There are no queues currently active. You can start one by using the \`${prefix}create\` command.`);
	    }

	},
};