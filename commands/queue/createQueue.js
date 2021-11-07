const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const hri = require('human-readable-ids').hri;
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'create',
	description: 'Creates a new queue',
	category: 'Registered Players',
	usage: 'Creates a new queue',
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

    	const player = await AuthService.getPlayerFromDiscordId(message.author);
    	if(!player) {
	    	await message.reply("You need to have an account registered first. Use the register command to do this");
        	return;
	    }

        const answers = {
        	type: '6mans',
        	game_mode: 'random',
        };

  		try {

			const typeFilter = (reaction, user) => {
	      		return ['6️⃣', '4️⃣', '2️⃣'].includes(reaction.emoji.name) && user.id === message.author.id;
	    	};

			answers.type = await new Promise(async function(resolve, reject) {
				
				let receiveNotificationMessage = await message.channel.send(`**What type of queue do you want to create?**
:six: 6-Mans
:four: 4-Mans
:two: 2-Mans`);

				await receiveNotificationMessage.react('6️⃣');
		        await receiveNotificationMessage.react('4️⃣');
		       	await receiveNotificationMessage.react('2️⃣');

		        receiveNotificationMessage.awaitReactions(typeFilter, { max: 1, time: 6000000, errors: ['time'] })
		        	.then(collected => {
		            	const reaction = collected.first();
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

			const gameModeFilter = (reaction, user) => {
	      		return ['🇷', '🇨', '🇧'].includes(reaction.emoji.name) && user.id === message.author.id;
	    	};

			answers.game_mode = await new Promise(async function(resolve, reject) {
				
				let receiveNotificationMessage = await message.channel.send(`
** **
**What mode will be used to select teams?**
:regional_indicator_r: Random: Slips6Mans will create teams randomly
:regional_indicator_c: Captains: Two queue participants will be chosen at random to be captain and will draw turns to select players
:regional_indicator_b: Balanced: Slips6Mans will try to balance the teams automatically`);

				await receiveNotificationMessage.react('🇷');
		        await receiveNotificationMessage.react('🇨');
		       	await receiveNotificationMessage.react('🇧');

		        receiveNotificationMessage.awaitReactions(gameModeFilter, { max: 1, time: 6000000, errors: ['time'] })
		        	.then(collected => {
		            	const reaction = collected.first();
		            	switch(reaction.emoji.name) {
		            		case '🇷':
		            			resolve('random');
		            			break;
		            		case '🇨':
		            			resolve('captains');
		            			break;
		            		case '🇧':
		            			resolve('balanced');
		            			break;
		            	}
		         	})
		          	.catch(collected => {
		            	message.reply('Sorry you did not respond in time! :cry:');
		            	reject('error');
		          	});

		   	 	});

		} catch(e) {
			await message.channel.send('Something went wrong with the registration process. Please try again.');
			return;
		}

		const newQueue = await models.Queue.build({
  			identifier: 1,
		    discord_guild_id: message.guild.id,
		    type: answers.type,
		    game_mode: answers.game_mode
		}).save();

		newQueue.identifier = newQueue.id + '-' + hri.random();
		await newQueue.save();

		await message.reply(`:ballot_box_with_check: Queue created: \`${newQueue.identifier}\``);

	},
};