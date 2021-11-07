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

async function downloadReplayFile(url, fileName) {  
  const localFile = path.resolve(process.cwd(), 'replays', fileName)
  const writer = fs.createWriteStream(localFile)

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

module.exports = {
	name: 'submitresult',
	description: 'This command allows participants in a queue to submit the results and complete a queue',
	category: 'Registered Players',
	usage: `This command will allow you to upload match replay files to complete a queue.`,
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


		const replayFiles = [];

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

  			
  			let selectedOption = '';

			while(selectedOption.toLowerCase() !== 'c') {

	  			await message.reply(`**Upload a replay file. If there are no replay files left to upload, type \`c\` to cancel**`);
				await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
					.then(async collected => {

						var reply = collected.first();
						if(reply.content.toLowerCase() === 'c') {
							selectedOption = 'c';
						} else {
							var attachment = reply.attachments.first();
						  	if(attachment) {
						  		console.log(attachment);
						  		replayFiles.push(attachment);
						  	} else {
						  		await message.reply('Sorry, I do not think you uploaded a replay file. Try again! :cry:');
						  		throw "error";
						  	}
						}

						
					})
					.catch(async collected => {
						if(collected === error) {
							throw "error";
						} else {
							await message.reply('Sorry, you did not respond in time! :cry:');
							return;
						}
					});
			}

		} catch(e) {
			await message.reply('Please try again.');
			return;
		}

		const parsedReplayStats = {
			team0: 0,
			team1: 0,
			players: {}
		};

		for(var attachment of replayFiles) {
			await downloadReplayFile(attachment.url, attachment.name);
			var file = path.resolve(process.cwd(), 'replays', attachment.name);

			let output = await new Promise(resolve => {

				var child = execFile(path.resolve(process.cwd(), 'rrrocket'), [file], (error, stdout, stderr) => {
				    if (error) {
				        console.error('stderr', stderr);
				        throw error;
				    }

				    resolve(JSON.parse(stdout));
				});
			});

		    var team0Score = parseInt(output.properties.Team0Score);
		    var team1Score = parseInt(output.properties.Team1Score);

		    if(team0Score > team1Score) {
				parsedReplayStats.team0++
		    } else {
		    	parsedReplayStats.team1++
		    }

		    for(var pObj of output.properties.PlayerStats) {
		      	var p = {
			        goals: pObj.Goals,
			        assists: pObj.Assists,
			        saves: pObj.Saves,
			        shots: pObj.Shots,
			        shots: pObj.Shots,
			        team: pObj.Team
		      	}
		      	parsedReplayStats.players[pObj.Name] = p;
		    }

		}

		console.log(parsedReplayStats);

		let teamOneMatched = false;
		let teamTwoMatched = false;

        if(parsedReplayStats.team0 == answers.home_team_score) {
            teamOneMatched = true;
        }

        if(parsedReplayStats.team0 == answers.away_team_score) {
            teamOneMatched = true;
        }

        if(!teamOneMatched) {
            await message.reply(`There was a problem matching Team0 in your replay file to one of the scores you entered.`);
			return;
        }

        if(parsedReplayStats.team1 == answers.home_team_score) {
            teamTwoMatched = true;
        }

        if(parsedReplayStats.team1 == answers.away_team_score) {
            teamTwoMatched = true;
        }

        if(!teamTwoMatched) {
            await message.reply(`There was a problem matching Team1 in your replay file to one of the scores you entered.`);
			return;
        }

        let playerMenu = '';
        for(var participant of queueParticipants) {
        	playerMenu += `[${participant.id}]: ${participant.player.discord_username}\n`;
        }

    	for(var p in parsedReplayStats.players) {

    		await message.channel.send(`**Can you match the following player in the replay file to one of the participants below?**
Enter the ID (the number in the square brackets) of the correct participant:
----------
${p}
Goals: ${parsedReplayStats.players[p].goals}
Shots: ${parsedReplayStats.players[p].shots}
Saves: ${parsedReplayStats.players[p].saves}
Assists: ${parsedReplayStats.players[p].assists}
----------

${playerMenu}`);

			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					var participantId = parseInt(collected.first().content);
					var foundParticipant = queueParticipants.filter(participant => participant.id === participantId);

					if(foundParticipant.length === 0) {
						throw "error";
					} else {

						// save their stats
						foundParticipant = foundParticipant[0];
						foundParticipant.goals = parsedReplayStats.players[p].goals;
						foundParticipant.shots = parsedReplayStats.players[p].shots;
						foundParticipant.saves = parsedReplayStats.players[p].saves;
						foundParticipant.assists = parsedReplayStats.players[p].assists;
						await foundParticipant.save();

						let newElo = 0;
						let didPlayerWin = (foundParticipant.team === answers.winning_team);

						// save their elo change
						if(didPlayerWin) {
							newElo = elo.ifWins(foundParticipant.elo, averageParticipantElo);
							foundParticipant.player.credits += 10000;
						} else {
							newElo = elo.ifLoses(foundParticipant.elo, averageParticipantElo);
							foundParticipant.player.credits += 5000;
						}

						await models.QueueEloChange.build({
				  			queue_id: queue.id,
				  			player_id: foundParticipant.player_id,
				  			starting_elo: foundParticipant.elo,
				  			ending_elo: newElo,
						    difference: foundParticipant.elo - newElo
						}).save();

						switch(queue.type) {
							case '6mans':
								foundParticipant.player.standard_elo_mmr = newElo;
								break;
							case '4mans':
								foundParticipant.player.doubles_elo_mmr = newElo;
								break;
							case '2mans':
								foundParticipant.player.duel_elo_mmr = newElo;
								break;
						}

						await foundParticipant.player.save();
						
					}
				})
				.catch(collected => {
					console.log(collected);
					if(collected === 'error') {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

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