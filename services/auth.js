const path = require("path") 
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const moment = require('moment');
const axios = require("axios");

var _this = this;

module.exports = exports = {

	async getPlayerByNameOrDiscordUsername(partiallyMatchingName) {
		return await new Promise(async function(resolve, reject) {
	  		const players = await models.Player.findAll({ 
	  			where: {
	  				discord_username: {
	  					[Op.like]: '%' + partiallyMatchingName + '%'
	  				}
	  			}
	  		});
	  		if(players.length === 0) {
	  			resolve(null);
	  		}
	  		resolve(players[0]);
    	});
	},
	
  	async getPlayerFromDiscordId(messageAuthor) {
  		return await new Promise(async function(resolve, reject) {
	  		const discordId  = messageAuthor.id;

	  		const player = await models.Player.findOne({ where: { discord_id: discordId }});
	  		if(!player) {
	  			return resolve(null);
	  		}
	  		resolve(player);
    	});
  	},

  	async getPlayerRankDetailsFromTracker(platform, gamerId) {
  		return await new Promise(async function(resolve, reject) {
			const res = await axios.get(`https://api.tracker.gg/api/v2/rocket-league/standard/profile/${platform}/${gamerId}/segments/playlist?season=18`);
		    const results  = res.data;

		    console.log(results);

		    if(!results.data) {
		    	resolve(null);
		    }

		    const response = {
		    	standard_rank: null,
			    standard_division: null,
			    standard_mmr: null,
			    doubles_rank: null,
			    doubles_division: null,
			    doubles_mmr: null,
			    duel_rank: null,
			    duel_division: null,
			    duel_mmr: null
		    };

		    const playlists = [
		    	'Ranked Duel 1v1',
		    	'Ranked Doubles 2v2',
		    	'Ranked Standard 3v3'
		    ];

		    for(var playlist of playlists) {
		    	let obj = exports.getPlaylistFromResult(playlist, results);
		    	if(!obj) {
		    		continue;
		    	}

		    	switch(playlist) {
		    		case 'Ranked Duel 1v1':
		    			response.duel_rank 	   	   = obj.rank;
		    			response.duel_division 	   = obj.division;
		    			response.duel_mmr 	   	   = obj.mmr;
		    			break;

		    		case 'Ranked Doubles 2v2':
		    			response.doubles_rank 	   = obj.rank;
		    			response.doubles_division  = obj.division;
		    			response.doubles_mmr 	   = obj.mmr;
		    			break;

		    		case 'Ranked Standard 3v3':
		    			response.standard_rank 	   = obj.rank;
		    			response.standard_division = obj.division;
		    			response.standard_mmr 	   = obj.mmr;
		    			break;
		    	}
		    }

		    resolve(response);

		});
  	},

  	getPlaylistFromResult(playListName, results) {
  		const collection = results.data.filter(playlist => playlist.metadata.name == playListName);
  		if(collection.length < 1) {
  			return null;
  		}
  		const playlist = collection[0];

  		return {
			rank: exports.convertRankNameToSlips(playlist.stats.tier.metadata.name),
			division: exports.convertDivisionToSlips(playlist.stats.division.metadata.name),
			mmr: playlist.stats.rating.value
  		}
  	},

 	convertRankNameToSlips(rankName) {
		const parts = rankName.split(' ');
		const lastPart = parts.pop();
		parts.push(exports._convertRomanToNumber(lastPart));
		return parts.join('_').toLowerCase();
	},

	convertDivisionToSlips(division) {
		const parts = division.split(' ');
		const lastPart = parts.pop();
		return exports._convertRomanToNumber(lastPart);
	},

	_convertRomanToNumber(roman) {
		switch(roman) {
			case 'I':
				return 1;
			case 'II':
				return 2;
			case 'III':
				return 3;
			case 'IV':
				return 4;
			default:
				return roman;
		}
	},

  	async checkUserIsAuthorized(guildMember, authorizedRoles) {
  		return await new Promise(async function(resolve, reject) {
  			const userRoles = [];
			guildMember.roles.cache.map(role => {
				userRoles.push(role.name);
			})
			for(role of authorizedRoles) {
				if(userRoles.indexOf(role) !== -1) {
					resolve(true);
				}
			}
			resolve(false);
    	});
  	},

};