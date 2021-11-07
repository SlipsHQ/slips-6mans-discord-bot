const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const Discord = require('discord.js');
const Moniker = require('moniker');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'convertqueue',
	description: 'This command allows participants in a queue to change the type of queue',
	category: 'Registered Players',
	usage: `Use this command to change the mode (6mans, 4mans, 2mans) which can be useful if you want queues to proceed if the participant limit has not been reached. You must be a participant in the queue to use this command!`,
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

	    // check the queue hasn't already started
		if(queue.status !== 'created') {
			await message.reply("This queue has already been started!");
        	return;
		}

	   	let queueParticipants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});
		
	   	// check if the user has joined this queue
		const foundPlayer = queueParticipants.filter(participant => participant.player_id === player.id);
		if(foundPlayer.length === 0) {
			await message.reply("You have not joined this queue so you cannot modify it!");
        	return;
		} 

		const answers = {
        	type: queue.type,
        	str: ''
        };

        switch(queue.type) {
        	case '6mans':
        		answers.str = `:four: 4-Mans
:two: 2-Mans`;
        		break;
        	case '4mans':
        		answers.str = `:six: 6-Mans
:two: 2-Mans`;
        		break;
        	case '2mans':
        		answers.str = `:two: 6-Mans
:four: 4-Mans`;
        		break;

        }

  		try {

			const typeFilter = (reaction, user) => {
	      		return ['6️⃣', '4️⃣', '2️⃣'].includes(reaction.emoji.name) && user.id === message.author.id;
	    	};

			answers.type = await new Promise(async function(resolve, reject) {
				
				let receiveNotificationMessage = await message.channel.send(`**What type of queue do you want to convert to?**
${answers.str}`);

				if(queue.type !== '6mans') {
					await receiveNotificationMessage.react('6️⃣');
				}

				if(queue.type !== '4mans') {
		        	await receiveNotificationMessage.react('4️⃣');
		        }

		        if(queue.type !== '2mans') {
		       		await receiveNotificationMessage.react('2️⃣');
		       	}

		        receiveNotificationMessage.awaitReactions(typeFilter, { max: 1, time: 6000000, errors: ['time'] })
		        	.then(collected => {
		            	const reaction = collected.first();
		            	console.log(reaction.emoji.name)
		            	switch(reaction.emoji.name) {
		            		case '6️⃣':
		            			resolve('6mans');
		            			break;
		            		case '4️⃣':
		            			resolve('4mans');
		            			break;
		            		case '2️⃣':
		            			resolve('2mans');
		            			break;
		            	}
		         	})
		          	.catch(collected => {
		            	message.reply('Sorry you did not respond in time! :cry:');
		            	reject('error');
		          	});

		   	 	});

		} catch(e) {
			await message.channel.send('Something went wrong. Please try again.');
			return;
		}

		let newMaxPlayers = (answers.type == '6mans') ? 6 : (answers.type == '4mans') ? 4 : 2;

		if(queueParticipants.length > newMaxPlayers) {
			await message.reply("The queue has too many players to be converted to this type, some players may need to leave!");
        	return;
		}

		queue.type = answers.type;
		await queue.save();
		await message.reply(`:ballot_box_with_check: The queue has been converted to: \`${queue.type}\``);

		if(queueParticipants.length === newMaxPlayers) {
			const newArgs = [queue.identifier];
			await message.client.commands.get('startqueue').execute(message, newArgs);
		}


	},
};