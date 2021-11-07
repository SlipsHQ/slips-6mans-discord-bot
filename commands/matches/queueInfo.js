const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const Discord = require('discord.js');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'queueinfo',
	description: 'Lets your view details about a queue (past or present)',
	category: 'Registered Players',
	usage: `Lets your view details about a specific queue (match). You should provide the queue identifier as an argument, e.g.  \`_PREFIX_match 1-cuddly-termite-8\`. The view will differ depending on whether the queue has started or not`,
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

	    if(args.length < 1) {
	    	await message.reply("You need to provide an identifier for the queue you want to view");
        	return;
	    }

		const queueIdentifier = args[0];
	    const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

	    // get guild prefix
    	const guild = await models.Guild.findOne({
			where: {
				discord_guild_id: message.guild.id
			}
		});

		const prefix = (guild) ? guild.prefix : '!';

		let guildServer = await models.Guild.findOne({ where: { discord_guild_id: queue.discord_guild_id }});
    	if(!guildServer) {
    		guildServer = {
    			name: 'Unknown Server'
    		}
    	}

		if(queue.status == 'created') {

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

			message.channel.send(embed);
			
		} 

		if(queue.status == 'in_progress') {

	    	let queueParticipants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});
	    	let homeTeamStr = '';
	    	let awayTeamStr = '';

	    	if(queueParticipants.length > 0) {
	    		for(var participant of queueParticipants) {
	    			let player = await models.Player.findByPk(participant.player_id);
	    			switch(queue.type) {
	    				case '6mans':
	    					if(participant.team == 'home') {
	    						homeTeamStr += `<@${player.discord_id}> (${player.standard_elo_mmr})\n`;
	    					} else {
	    						awayTeamStr += `<@${player.discord_id}> (${player.standard_elo_mmr})\n`;
	    					}
	    					break;
	    				case '4mans':
	    					if(participant.team == 'home') {
	    						homeTeamStr += `<@${player.discord_id}> (${player.doubles_elo_mmr})\n`;
	    					} else {
	    						awayTeamStr += `<@${player.discord_id}> (${player.doubles_elo_mmr})\n`;
	    					}
	    					break;
	    				case '2mans':
	    					if(participant.team == 'home') {
	    						homeTeamStr += `<@${player.discord_id}> (${player.duel_elo_mmr})\n`;
	    					} else {
	    						awayTeamStr += `<@${player.discord_id}> (${player.duel_elo_mmr})\n`;
	    					}
	    					break;
	    			}
	    		}
	    	}

	    	const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(queue.identifier)
				.setDescription(`Created on **${guildServer.name}**`)
				.addFields(
					{ name: 'Type', value: queue.type, inline: true },
					{ name: 'Selection Mode', value: queue.game_mode, inline: true },
					{ name: 'Status', value: queue.status, inline: true },
					{ name: 'Home Team', value: homeTeamStr },
					{ name: 'Away Team', value: awayTeamStr },
					{ name: 'Lobby Username', value: queue.username, inline: true },
					{ name: 'Lobby Password', value: queue.password, inline: true },
				)
				.setFooter(`To report the results of this queue: ${prefix}submitresult ${queue.identifier}`);

			message.channel.send(embed);

		}

		if(queue.status == 'completed') {

			let queueParticipants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});
	    	let homeTeamStr = '';
	    	let awayTeamStr = '';

	    	if(queueParticipants.length > 0) {
	    		for(var participant of queueParticipants) {
	    			participant.player = await models.Player.findByPk(participant.player_id);
	 				participant.elo_change = await models.QueueEloChange.findOne({
	 					where: {
							player_id: participant.player.id,
							queue_id: queue.id					
	 					}
	 				});

					if(participant.team == 'home') {
						homeTeamStr += `<@${participant.player.discord_id}> `;
					} else {
						awayTeamStr += `<@${participant.player.discord_id}> `;
					}
	    		}
	    	}

	    	const embed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(queue.identifier)
				.setDescription(`Created on **${guildServer.name}**`)
				.addFields(
					{ name: 'Type', value: queue.type, inline: true },
					{ name: 'Selection Mode', value: queue.game_mode, inline: true },
					{ name: 'Status', value: queue.status, inline: true },
					{ name: (queue.winner == 'home') ? 'Winning Team' : 'Home Team', value: homeTeamStr },
					{ name: (queue.winner == 'away') ? 'Winning Team' : 'Away Team', value: awayTeamStr },
					{ name: 'Home Team Score', value: queue.home_team_score, inline: true },
					{ name: 'Away Team Score', value: queue.away_team_score, inline: true },
					{ name: '\u200B', value: '\u200B', inline: true },
				);

			for(var participant of queueParticipants) {
				var eloChange = `${participant.elo_change.starting_elo} -> ${participant.elo_change.ending_elo}`
				embed.addFields({ name: participant.player.discord_username, value: eloChange, inline: true })
			}

				embed.setFooter(`To report the results of this queue: ${prefix}submitresult ${queue.identifier}`);

			message.channel.send(embed);
			
		} 

	},
};