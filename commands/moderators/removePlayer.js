const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'removeplayer',
	category: 'Moderators',
	description: 'Allows moderators to manually remove a player from a queue',
	usage: `Call the \`_PREFIX_removeplayer <@tagged_user> <queue-id>\` command to manually remove a player from a queue.`,
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
		if(foundPlayer.length === 0) {
			await message.reply("The player you want to remove is not in this queue!");
        	return;
		} 

		let playerToRemove = foundPlayer[0];
		await playerToRemove.destroy({ force: true });

		await message.reply(`:ballot_box_with_check: ${player.discord_username} has been removed from the queue: \`${queue.identifier}\``);

	},
};