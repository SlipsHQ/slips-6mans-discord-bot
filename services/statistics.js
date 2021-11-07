const path = require("path") 
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

module.exports = {

  async getBestOverallPlayerFromList(playerList) {
  	let bestPlayer = null;
    for(var p of playerList) {
      if(bestPlayer == null) {
        bestPlayer = p;
      }
      if((p.stats.goals + p.stats.assists + p.stats.saves) > (bestPlayer.stats.goals + bestPlayer.stats.assists + bestPlayer.stats.saves)) {
        bestPlayer = p;
      }
    }
    return bestPlayer;
  },

  async getBestAttackerFromList(playerList) {
    let bestPlayer = null;
    for(var p of playerList) {
      if(bestPlayer == null) {
        bestPlayer = p;
      }
      if((p.stats.goals + p.stats.assists) > (bestPlayer.stats.goals + bestPlayer.stats.assists)) {
        bestPlayer = p;
      }
    }
    return bestPlayer;
  },

  async getBestDefenderFromList(playerList) {
    let bestPlayer = null;
    for(var p of playerList) {
      if(bestPlayer == null) {
        bestPlayer = p;
      }
      if(p.stats.saves > bestPlayer.stats.saves) {
        bestPlayer = p;
      }
    }
    return bestPlayer;
  },

  async getTopGoalScorerFromList(playerList) {
    let bestPlayer = null;
    for(var p of playerList) {
      if(bestPlayer == null) {
        bestPlayer = p;
      }
      if(p.stats.goals > bestPlayer.stats.goals) {
        bestPlayer = p;
      }
    }
    return bestPlayer;
  },

  async getMostAssistMakerFromList(playerList) {
    let bestPlayer = null;
    for(var p of playerList) {
      if(bestPlayer == null) {
        bestPlayer = p;
      }
      if(p.stats.assists > bestPlayer.stats.assists) {
        bestPlayer = p;
      }
    }
    return bestPlayer;
  },

  async getMostSavesMakerFromList(playerList) {
    let bestPlayer = null;
    for(var p of playerList) {
      if(bestPlayer == null) {
        bestPlayer = p;
      }
      if(p.stats.saves > bestPlayer.stats.saves) {
        bestPlayer = p;
      }
    }
    return bestPlayer;
  },

  

};