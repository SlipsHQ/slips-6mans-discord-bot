const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const axios = require("axios");

const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'updatemystats',
	description: 'Allows a player to automatically update their stats',
	category: 'Registered Players',
	usage: `You can call this command to update your MMR, Rank, Division and Valuation automatically.`,
	async execute(message, args) {

		if (message.client.usedStatsCommandRecently.has(message.author.id)) {
            await message.reply('You can only update your stats once a day, try again later');
            return;
	    }

	    // check if a user record exists
	    const player = await AuthService.getPlayerFromDiscordId(message.author);
	    if(!player) {
	    	await message.reply("You need to have an account registered first. Use the register command to do this");
        	return;
	    }

	    // get player statistics
		const playerRankDetails = await AuthService.getPlayerRankDetailsFromTracker(player.platform, player.gamer_id);
		if(!playerRankDetails) {
			await message.reply('There was an issue with retrieving your stats. Please contact the admins.')
			return;
		}

		player.standard_rank = (playerRankDetails.standard_rank !== null)
		    	? playerRankDetails.standard_rank : 'bronze_1';
		player.standard_division = (playerRankDetails.standard_division !== null) 
		    	? playerRankDetails.standard_division : 1;
		player.standard_mmr = (playerRankDetails.standard_mmr !== null) 
		    	? playerRankDetails.standard_mmr : 0;

		player.doubles_rank = (playerRankDetails.doubles_rank !== null) 
		    	? playerRankDetails.doubles_rank : 'bronze_1';
		player.doubles_division = (playerRankDetails.doubles_division !== null) 
		    	? playerRankDetails.doubles_division : 1;
		player.doubles_mmr = (playerRankDetails.doubles_mmr !== null) 
		    	? playerRankDetails.doubles_mmr : 0;

		player.duel_rank = (playerRankDetails.duel_rank !== null) 
		    	? playerRankDetails.duel_rank : 'bronze_1';
		player.duel_division = (playerRankDetails.duel_division !== null) 
		    	? playerRankDetails.duel_division : 1;
		player.duel_mmr = (playerRankDetails.duel_mmr !== null) 
		    	? playerRankDetails.duel_mmr : 0;

		await player.save();

		await message.reply(`:ballot_box_with_check: Your stats have been updated!`);

	    // block the user from running the command again
        message.client.usedStatsCommandRecently.add(message.author.id);
        setTimeout(() => {
          message.client.usedStatsCommandRecently.delete(message.author.id);
        }, 86400000);
	},
};