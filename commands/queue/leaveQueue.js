const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'lq',
	description: 'Leave a queue',
	category: 'Registered Players',
	usage: `Leave a queue, you need to provide the queue identifier as an argument to this command. Example: \`_PREFIX_lq 1-hummingbird-total-4\` You can use the \`_PREFIX_queues\` command to find the active queues`,
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

	    if(args.length < 1) {
	    	await message.reply("You need to provide an identifier for the queue you want to join");
        	return;
	    }

	    // get the queue
		const queueIdentifier = args[0];
	    const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

		if(queue.status !== 'created') {
			await message.reply("This queue has already started or been completed! Ask a moderator to remove you!");
        	return;
		}

		// get the participants
		const participants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});

		// check if the user has not joined
		const foundPlayer = participants.filter(participant => participant.player_id === player.id);
		if(foundPlayer.length === 0) {
			await message.reply("You have not joined this queue!");
        	return;
		} 

		const participant = foundPlayer[0];
		await participant.destroy({ force: true });

		await message.reply(`:ballot_box_with_check: You have left the queue: \`${queue.identifier}\``);

		// display the queue details
		const newArgs = [queue.identifier];
		await message.client.commands.get('queueinfo').execute(message, newArgs);


	},
};