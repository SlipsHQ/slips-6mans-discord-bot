const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'jq',
	description: 'Join a queue',
	category: 'Registered Players',
	usage: `Join a queue, you need to provide the queue identifier as an argument to this command. Example: \`_PREFIX_jq 1-hummingbird-total-4\` You can use the \`_PREFIX_queues\` command to find the active queues`,
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

    	// get the player
    	const player = await AuthService.getPlayerFromDiscordId(message.author);
    	if(!player) {
	    	await message.reply("You need to have an account registered first. Use the register command to do this");
        	return;
	    }

	    let queueIdentifier = null;

	    if(args.length < 1) {

	    	// get queues
	    	const whereClause = {
	    		status: {
	    			[Op.in]: ['created', 'in_progress']
	    		}
	    	}

		    const allQueues = await models.Queue.findAll({
		    	where: whereClause
		    });

	    	let queueId = null;
		    let queueMessage = '';

		    for(var q of allQueues) {
		    	queueMessage += `[${q.id}]: ${q.identifier}\n`;
		    }

		    if(!allQueues.length) {
		    	queueMessage = '*There are no open queues at the moment*';
		    }

	    	try {
	  			await message.channel.send(`** Choose the ID of the queue you want to join**\n${queueMessage}`);
	  			if(!allQueues.length) {
					return;
				}
				await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 300000, errors: ['time'] })
					.then(async collected => {
						queueId = parseInt(collected.first().content);
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
				await message.channel.send('Please try again.');
				return;
			}

			queueIdentifier = allQueues.filter(queue => queue.id == queueId)[0]?.identifier;

	    } else {
	    	queueIdentifier = args[0];
	    }

	    if(!queueIdentifier) {
	    	await message.reply("No queue identifier was provided!");
        	return;
	    }

	    // get the queue
	    const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

		if(queue.status !== 'created') {
			await message.reply("This queue has already started or been completed!");
        	return;
		}

		// get the participants
		const participants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});

		// check if the queue is already full
		let maxPlayers = (queue.type == '6mans') ? 6 : (queue.type == '4mans') ? 4 : 2;
		if(participants.length >= maxPlayers) {
			await message.reply("This queue is already full!");
        	return;
		}

		// check if the user has already joined
		const foundPlayer = participants.filter(participant => participant.player_id === player.id);
		if(foundPlayer.length > 0) {
			await message.reply("You have already joined this queue!");
        	return;
		} 

		// add the player to the queue
		const newParticipant = await models.QueueParticipant.build({
  			queue_id: queue.id,
  			player_id: player.id,
		}).save();

		await message.reply(`:ballot_box_with_check: You have joined the queue: \`${queue.identifier}\``);

		// display the queue details
		const newArgs = [queue.identifier];
		await message.client.commands.get('queueinfo').execute(message, newArgs);

		if((participants.length + 1) == maxPlayers) {
			await message.client.commands.get('startqueue').execute(message, newArgs);
		}


	},
};