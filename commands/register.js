const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'register',
	description: 'Lets you register as a player in the 6mans system',
	category: 'Everyone',
	usage: 'Lets you register an account to use the system as a player',
	async execute(message, args) {

		if(message.guild === null) {
      		await message.reply('Call me from the Discord, not in a DM!')
      		return;
    	}

    	const player = await AuthService.getPlayerFromDiscordId(message.author);
    	if(player) {
    		await message.reply('You have already registered, if you want to see your profile, use the `viewplayer` command');
    		return;
    	}

        const answers = {
        	tracker_url: null,
        	receive_notifications: false,
        	platform: null,
        	gamer_id: null
        };

  		try {
  			await message.channel.send(`**1) Go to https://rocketleague.tracker.network and search for your profile. 
2) Paste the link to the profile here once you find it. 

It should look like \`https://rocketleague.tracker.network/rocket-league/profile/psn/Lunar-Brawler/overview\`**`);
			await message.channel.awaitMessages((m) => message.author.id === m.author.id, { max: 1, time: 6000000, errors: ['time'] })
				.then(async collected => {
					answers.tracker_url = collected.first().content;

					if(!answers.tracker_url.includes('rocketleague.tracker.network')) {
						throw "tracker_url_error";
					}

					let pattern = /(?<!\?.+)(?<=\/)[\w-]+(?=[/\r\n?]|$)/g
					let results = answers.tracker_url.match(pattern);

					if(results.length !== 5) {
						throw "tracker_url_error";
					}

					answers.platform = results[2];
					answers.gamer_id = results[3];

				})
				.catch(collected => {
					if(collected === error) {
						throw "error";
					} else {
						message.channel.send('Sorry, you did not respond in time! :cry:');
						return;
					}
				});

			const filter = (reaction, user) => {
	      		return ['🇾', '🇳'].includes(reaction.emoji.name) && user.id === message.author.id;
	    	};

			answers.receive_notifications = await new Promise(async function(resolve, reject) {
				
				let receiveNotificationMessage = await message.channel.send(`**Do you wish to be notified about cash prize tournaments and events?** 
You'd receive a DM whenever one of our verified servers want to push an event. You can disable these notifications if you change your mind later`);

				await receiveNotificationMessage.react('🇾');
		        await receiveNotificationMessage.react('🇳');

		        receiveNotificationMessage.awaitReactions(filter, { max: 1, time: 300000, errors: ['time'] })
		        	.then(collected => {
		            	const reaction = collected.first();
		            	switch(reaction.emoji.name) {
		            		case '🇾':
		            			resolve(true)
		            			break;
		            		case '🇳':
		            			resolve(false)
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

		// get player statistics
		const playerRankDetails = await AuthService.getPlayerRankDetailsFromTracker(answers.platform, answers.gamer_id);
		if(!playerRankDetails) {
			await message.reply('There was an issue with retrieving your stats. You will need to be registered manually. Please contact the admins.')
			return;
		}

		// get the discord the user is trying to sign up from
		const guild = await models.Guild.findOne({
			where: {
				discord_guild_id: message.guild.id
			}
		})
		if(!guild) {
			await message.reply('The server you are trying to register from has not been registered yet. Ask the server admin to use the "registerserver" command first.')
			return;
		}

		const newPlayer = await models.Player.build({
  			guild_id: guild.id,
		    discord_id: message.author.id,
		    discord_username: message.author.username + '#' + message.author.discriminator,

		    standard_rank: (playerRankDetails.standard_rank !== null)
		    	? playerRankDetails.standard_rank : 'bronze_1',
		    standard_division: (playerRankDetails.standard_division !== null) 
		    	? playerRankDetails.standard_division : 1,
		    standard_mmr: (playerRankDetails.standard_mmr !== null) 
		    	? playerRankDetails.standard_mmr : 0,
		    standard_elo_mmr: (playerRankDetails.standard_mmr !== null) 
		    	? playerRankDetails.standard_mmr : 0,

		    doubles_rank: (playerRankDetails.doubles_rank !== null) 
		    	? playerRankDetails.doubles_rank : 'bronze_1',
		    doubles_division: (playerRankDetails.doubles_division !== null) 
		    	? playerRankDetails.doubles_division : 1,
		    doubles_mmr: (playerRankDetails.doubles_mmr !== null) 
		    	? playerRankDetails.doubles_mmr : 0,
		    doubles_elo_mmr: (playerRankDetails.doubles_mmr !== null) 
		    	? playerRankDetails.doubles_mmr : 0,

		    duel_rank: (playerRankDetails.duel_rank !== null) 
		    	? playerRankDetails.duel_rank : 'bronze_1',
		    duel_division: (playerRankDetails.duel_division !== null) 
		    	? playerRankDetails.duel_division : 1,
		    duel_mmr: (playerRankDetails.duel_mmr !== null) 
		    	? playerRankDetails.duel_mmr : 0,
		    duel_elo_mmr: (playerRankDetails.duel_mmr !== null) 
		    	? playerRankDetails.duel_mmr : 0,

		    platform: answers.platform,
		    gamer_id: answers.gamer_id,
		    bio: '',
		    credits: 5000,
		    twitter_link: '',
		    receive_notifications: answers.receive_notifications
		}).save();

		await message.reply(`:ballot_box_with_check: Your account is registered, go play some 6mans!`);

	},
};