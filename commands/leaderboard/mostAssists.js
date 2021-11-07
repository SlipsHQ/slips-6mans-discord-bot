const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
  name: 'mostassists',
  description: 'Produces a list of top assist makers',
  usage: `Use this command to view a list of the top 20 players in descending order rated by the number of assists they've made`,
  category: 'Everyone',
  async execute(message, args) {

  
        const title = 'The top 20 goal creators at the moment are'

        let content = '';

        const entries = await models.QueueParticipant.findAll({
            attributes: [['any_value(id)', 'id'], ['sum(assists)','assists'], 'player_id'],
            order: [
                ['assists', 'DESC']
            ],
            group: ['player_id', 'assists'],
            limit: 20
        });

        content += `\n:small_blue_diamond: **${title}:** :small_blue_diamond:\n`;

        for(var entry of entries) {
            var player = await models.Player.findByPk(entry.player_id)
            if(player) {
                content += `${player.discord_username} --- ${entry.assists} assists\n`;
            }
        }

        message.channel.send(content, { split: true });

  }
};