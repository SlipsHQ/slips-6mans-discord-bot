const path = require("path") 
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Discord = require('discord.js');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

function formatRankHuman(originalRank) {
	originalRank = originalRank.replace('_', ' ');
	const parts = originalRank.split(' ');

	return parts.map((part) => { 
    	return part[0].toUpperCase() + part.substring(1); 
	}).join(" ");
}

function formatCurrency(number) {
	return (number).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

module.exports = {
	name: 'viewplayer',
	category: 'Everyone',
	description: 'Gives you information about a registered player',
	usage: `Gives you information about a registered player`,
	async execute(message, args) {

		// do some basic validation
		if(args.length < 1) {
			await message.reply(`You didn't supply enough arguments for this command.`);
  			return;
		}

		const userTagged = message.mentions.users.first();
		if(userTagged === undefined || userTagged === null) {
			await message.reply("Sorry - you did not tag anyone!");
			return;
		}
			
		const player = await AuthService.getPlayerFromDiscordId(userTagged);

		if(!player) {
			message.reply("Sorry - I can't find that player. They might not have registered?");
			return;
		}

		const allTimeStats = {
        	goals: 0,
        	assists: 0,
        	saves: 0,
        	shots: 0
        }

        const playerHistory = await models.QueueParticipant.findAll({
            where: {
                player_id: player.id
            }
        });

        for(var history of playerHistory) {
        	allTimeStats.goals += history.goals;
        	allTimeStats.assists += history.assists;
        	allTimeStats.saves += history.saves;
        	allTimeStats.shots += history.shots;
        }

		message.channel.send(`Information for **${player.discord_username}**
**Credit Balance**: ${formatCurrency(player.credits)}
--------------------------------------------
**Bio**: ${(player.bio !== '') ? player.bio : 'Set your bio by using the `updatebio` command'}
**Twitter**: ${(player.twitter_link !== '') ? player.twitter_link : 'Set your twitter by using the `updatetwitter` command'}
**Duel Rank**: ${formatRankHuman(player.duel_rank)} - ${player.duel_division} (${player.duel_elo_mmr})
**Doubles Rank**: ${formatRankHuman(player.doubles_rank)} - ${player.doubles_division} (${player.doubles_elo_mmr})
**Standard Rank**: ${formatRankHuman(player.standard_rank)} - ${player.standard_division} (${player.standard_elo_mmr})
**Platform**: ${player.platform}
**Gamer ID**: ${player.gamer_id}
--------------------------------------------
**All Time Stats**:
--------------------------------------------
**6 Mans**: P: ${player['6mans_played']}, W: ${player['6mans_won']}, L: ${player['6mans_lost']}
**4 Mans**: P: ${player['4mans_played']}, W: ${player['4mans_won']}, L: ${player['4mans_lost']}
**2 Mans**: P: ${player['2mans_played']}, W: ${player['2mans_won']}, L: ${player['2mans_lost']}

**Goals**: ${allTimeStats.goals}
**Shots**: ${allTimeStats.shots}
**Assists**: ${allTimeStats.assists}
**Saves**: ${allTimeStats.saves}
`, { split: true });

	},
};