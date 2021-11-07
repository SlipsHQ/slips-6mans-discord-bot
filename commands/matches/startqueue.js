const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const Discord = require('discord.js');
const Moniker = require('moniker');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'startqueue',
	description: 'This command starts a queue that has enough players',
	category: 'Registered Players',
	usage: `This command starts a queue that has enough players. If the queue mode is "captains", it will start a drafting process by randomly picking captains`,
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

	    if(args.length < 1) {
	    	await message.reply("You need to provide an identifier for the queue you want to start");
        	return;
	    }

		const queueIdentifier = args[0];
	    const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

		if(queue.status !== 'created') {
			await message.reply("This queue has already been started!");
        	return;
		}

	   	let queueParticipants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});
	   	let maxPlayers = (queue.type == '6mans') ? 6 : (queue.type == '4mans') ? 4 : 2;
		if(queueParticipants.length < maxPlayers) {
			await message.reply("This queue is not yet full!");
        	return;
		}

		// handle queue starting if game_mode = 'random'
		if(queue.game_mode == 'random') {

			const homeTeam = [];
			const awayTeam = [];

			for(var participant of queueParticipants) {
				var rand = Math.floor(Math.random() * 2);
				if(rand) {
					if(homeTeam.length < maxPlayers / 2) {
						homeTeam.push(participant);
						participant.team = 'home';
						await participant.save();
					} else {
						awayTeam.push(participant);
						participant.team = 'away';
						await participant.save();
					}
				} else {
					if(awayTeam.length < maxPlayers / 2) {
						awayTeam.push(participant);
						participant.team = 'away';
						await participant.save();
					} else {
						homeTeam.push(participant);
						participant.team = 'home';
						await participant.save();
					}
				}
			}

		}

		// handle queue starting if game_mode = 'balanced'
		if(queue.game_mode == 'balanced') {

			for(var participant of queueParticipants) {
				let player = await models.Player.findByPk(participant.player_id);
				participant.standard_elo_mmr = player.standard_elo_mmr;
				participant.doubles_elo_mmr = player.doubles_elo_mmr;
				participant.duel_elo_mmr = player.duel_elo_mmr;
			}

			queueParticipants.sort((a,b) => {
				switch(queue.type) {
					case '6mans':
						return a.standard_elo_mmr - b.standard_elo_mmr;
					case '4mans':
						return a.doubles_elo_mmr - b.doubles_elo_mmr;
					case '2mans':
						return a.duel_elo_mmr - b.duel_elo_mmr;
				}
			});

			let count = 1;
			for(var participant of queueParticipants) {
				if(count % 2 !== 0) {
					participant.team = 'home';
					await participant.save();
				} else {
					participant.team = 'away';
					await participant.save();
				}
				count++;
			};

		}

		// handle queue starting if game_mode = 'captains'
		if(queue.game_mode == 'captains') {


		}

		let nameStr = Moniker.generator([Moniker.adjective, Moniker.noun]);
		let namePair = nameStr.choose().split('-');
		
		queue.username = namePair[0];
		queue.password = namePair[1];
		queue.status   = 'in_progress';

		await queue.save();

		let tagStr = '';

		for(var participant of queueParticipants) {
			let player = await models.Player.findByPk(participant.player_id);
			tagStr += `<@${player.discord_id}> `;
		}

		await message.channel.send(tagStr + ` the queue **${queue.identifier}** is now ready to be played. Please note the lobby username and password below. Remember to save the match replay files to submit the result:`);

		// display the queue details
		const newArgs = [queue.identifier];
		await message.client.commands.get('queueinfo').execute(message, newArgs);

	},
};