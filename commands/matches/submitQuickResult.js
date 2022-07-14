const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const Discord = require('discord.js');
const http = require('http');
const fs = require('fs');
const axios = require("axios");
const execFile = require('child_process').execFile;
var Elo = require( 'elo-js' );

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'submitquickresult',
	description: 'This command allows participants in a queue to submit the results and complete a queue without uploading rpelay files',
	category: 'Registered Players',
	usage: `This command will allow you to complete a queue without uploading replay files.`,
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

    	const elo = new Elo();

    	// get the player
    	const player = await AuthService.getPlayerFromDiscordId(message.author);
    	if(!player) {
	    	await message.reply("You need to have an account registered first. Use the register command to do this");
        	return;
	    }

	    // get the queue
	    if(args.length < 1) {
	    	await message.reply("You need to provide an identifier for the queue you want to modify");
        	return;
	    }

		const queueIdentifier = args[0];
	    const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

	    // check the queue has not already bee finished
		if(queue.status !== 'in_progress') {
			await message.reply("This queue has either not been started or is already completed!");
        	return;
		}

	   	let queueParticipants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});
		
	   	// check if the user has joined this queue
		const foundPlayer = queueParticipants.filter(participant => participant.player_id === player.id);
		if(foundPlayer.length === 0) {
			await message.reply("You have not joined this queue so you cannot submit results for it!");
        	return;
		} 


		let homeTeamStr = '';
		let awayTeamStr = '';
		let totalParticipantElo = 0

		for(var participant of queueParticipants) {
			participant.player = await models.Player.findByPk(participant.player_id);

			switch(queue.type) {
				case '6mans':
					totalParticipantElo += participant.player.standard_elo_mmr;
					participant.elo = participant.player.standard_elo_mmr;
					break;
				case '4mans':
					totalParticipantElo += participant.player.doubles_elo_mmr;
					participant.elo = participant.player.doubles_elo_mmr;
					break;
				case '2mans':
					totalParticipantElo += participant.player.duel_elo_mmr;
					participant.elo = participant.player.duel_elo_mmr;
					break;
			}

			if(participant.team == 'home') {
				homeTeamStr += `<@${participant.player.discord_id}> `;
			} else {
				awayTeamStr += `<@${participant.player.discord_id}> `;
			}
		}

		let averageParticipantElo = (totalParticipantElo/queueParticipants.length).toFixed(0);

		const answers = {
			winning_team: null,
			matches_played: null,
			home_team_score: 0,
			away_team_score: 0
		}

		try {

			const filter = (reaction, user) => {
	      		return ['🇭', '🇦'].includes(reaction.emoji.name) && user.id === message.author.id;
	    	};

			answers.winning_team = await new Promise(async function(resolve, reject) {
				
				let receiveNotificationMessage = await message.channel.send(`**Who won the match?**
:regional_indicator_h: Home Team: ${homeTeamStr}
:regional_indicator_a: Away Team: ${awayTeamStr}
`);

				await receiveNotificationMessage.react('🇭');
		        await receiveNotificationMessage.react('🇦');

		        receiveNotificationMessage.awaitReactions(filter, { max: 1, time: 6000000, errors: ['time'] })
		        	.then(collected => {
		            	const reaction = collected.first();
		            	switch(reaction.emoji.name) {
		            		case '🇭':
		            			resolve('home');
		            			break;
		            		case '🇦':
		            			resolve('away');
		            			break;
		            	}
		         	})
		          	.catch(collected => {
		            	message.reply('Sorry you did not respond in time! :cry:');
		            	reject('error');
		          	});
		   	});

		   	await message.channel.send(`**How many matches were played? 3, 5, 7...**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.matches_played = parseInt(collected.first().content);
				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

			await message.channel.send(`**How many matches did the HOME team win?**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.home_team_score = parseInt(collected.first().content);
				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});


			await message.channel.send(`**How many matches did the AWAY team win?**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.away_team_score = parseInt(collected.first().content);
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
			await message.reply('Please try again.');
			return;
		}

		for(var participant of queueParticipants) {

			let newElo = 0;
			let didPlayerWin = (participant.team === answers.winning_team);

			// save their elo change
			if(didPlayerWin) {
				newElo = elo.ifWins(participant.elo, averageParticipantElo);
				participant.player.credits += 25000;
				switch(queue.type) {
					case '6mans':
						participant.player['6mans_played']++;
						participant.player['6mans_won']++;
						break;
					case '4mans':
						participant.player['4mans_played']++;
						participant.player['4mans_won']++;
						break;
					case '2mans':
						participant.player['2mans_played']++;
						participant.player['2mans_won']++;
						break;
				}

			} else {
				newElo = elo.ifLoses(participant.elo, averageParticipantElo);
				participant.player.credits += 10000;
				switch(queue.type) {
					case '6mans':
						participant.player['6mans_played']++;
						participant.player['6mans_lost']++;
						break;
					case '4mans':
						pparticipant.player['4mans_played']++;
						participant.player['4mans_lost']++;
						break;
					case '2mans':
						participant.player['2mans_played']++;
						participant.player['2mans_lost']++;
						break;
				}
			}

			await models.QueueEloChange.build({
	  			queue_id: queue.id,
	  			player_id: participant.player_id,
	  			starting_elo: participant.elo,
	  			ending_elo: newElo,
			    difference: participant.elo - newElo
			}).save();

			switch(queue.type) {
				case '6mans':
					participant.player.standard_elo_mmr = newElo;
					break;
				case '4mans':
					participant.player.doubles_elo_mmr = newElo;
					break;
				case '2mans':
					participant.player.duel_elo_mmr = newElo;
					break;
			}

			await participant.player.save();
			
		}

    	// save the match result
    	queue.winner = answers.winning_team;
    	queue.home_team_score = answers.home_team_score;
    	queue.away_team_score = answers.away_team_score;
    	queue.status = 'completed';
    	await queue.save();

    	await message.reply(`:ballot_box_with_check: Result has been submitted for **${queue.identifier}**`);
	
	},
};