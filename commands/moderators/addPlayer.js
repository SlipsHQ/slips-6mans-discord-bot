const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'addplayer',
	category: 'Moderators',
	description: 'Allows moderators to manually add a player to a queue',
	usage: `Call the \`_PREFIX_addplayer <@tagged_user> <queue-id>\` command to manually add a player to a queue.`,
	async execute(message, args) {

		// do some basic validation
		if(args.length < 2) {
			await message.reply(`You didn't supply enough arguments for this command.`);
  			return;
		}

		const userTagged = message.mentions.users.first();
		if(userTagged === undefined || userTagged === null) {
			await message.reply(`You didn't tag a user.`);
  			return;
		}

		// verify the calling user is a server admin
		const guild = await models.Guild.findOne({
			where: {
				discord_guild_id: message.guild.id
			}
		});

		if(!guild) {
			await message.reply(`Your server has not been registered yet.`);
  			return;
		}

		if(guild.owner_discord_id !== message.author.id) {
			await message.reply(`You are not an authorized moderator on this server.`);
  			return;
		}

		const queueIdentifier = args[1];
		const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

	    if(queue.status !== 'created') {
	    	await message.reply("This queue has already started!");
        	return;
	    }

		// check if the user is real
		const player = await AuthService.getPlayerFromDiscordId(userTagged);
		if(!player) {
			message.reply("Sorry - I can't find that player. They might not have registered?");
			return;
		}

		// get the participants
		const participants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});

		// check if the user has already joined
		const foundPlayer = participants.filter(participant => participant.player_id === player.id);
		if(foundPlayer.length > 0) {
			await message.reply("The player has already been added to the queue!");
        	return;
		} 

		// add the player to the queue
		const newParticipant = await models.QueueParticipant.build({
  			queue_id: queue.id,
  			player_id: player.id,
		}).save();

		await message.reply(`:ballot_box_with_check: ${player.discord_username} has been added to the queue: \`${queue.identifier}\``);

		let maxPlayers = (queue.type == '6mans') ? 6 : (queue.type == '4mans') ? 4 : 2;
		const newArgs = [queue.identifier];
		if((participants.length + 1) == maxPlayers) {
			await message.client.commands.get('startqueue').execute(message, newArgs);
		}

	},
};