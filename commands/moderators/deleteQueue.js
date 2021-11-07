const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'deletequeue',
	category: 'Moderators',
	description: 'Allows moderators to manually delete a queue',
	usage: `Call the \`_PREFIX_deletequeue <queue-id>\` command to manually delete queue.`,
	async execute(message, args) {

		// do some basic validation
		if(args.length < 1) {
			await message.reply(`You didn't supply enough arguments for this command.`);
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

		const queueIdentifier = args[0];
		const queue = await models.Queue.findOne({ where: { identifier: queueIdentifier }});
	    if(!queue) {
	    	await message.reply("Cannot find the queue with the identifier you provided, try again!");
        	return;
	    }

		// get the participants
		const participants = await models.QueueParticipant.findAll({ where: { queue_id: queue.id }});
		const elo_changes = await models.QueueEloChange.findAll({ where: { queue_id: queue.id }});

		for(var participant of participants) {
			await participant.destroy({ force: true });
		}

		for(var elo_change of elo_changes) {
			await elo_change.destroy({ force: true });
		}

		const identifier = queue.identifier
		await queue.destroy();

		await message.reply(`:ballot_box_with_check: ${identifier} has been deleted`);

	},
};