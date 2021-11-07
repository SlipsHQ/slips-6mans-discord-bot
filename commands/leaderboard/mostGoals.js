const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
  name: 'mostgoals',
  description: 'Produces a list of top goal scorers',
  usage: `Use this command to view a list of the top 20 players in descending order rated by the number of goals they've scored`,
  category: 'Everyone',
  async execute(message, args) {

  
        const title = 'The top 20 goal creators at the moment are'

        let content = '';

        const entries = await models.QueueParticipant.findAll({
            attributes: [['any_value(id)', 'id'], ['sum(goals)','goals'], 'player_id'],
            order: [
                ['goals', 'DESC']
            ],
            group: ['player_id', 'goals'],
            limit: 20
        });

        content += `\n:small_blue_diamond: **${title}:** :small_blue_diamond:\n`;

        for(var entry of entries) {
            var player = await models.Player.findByPk(entry.player_id)
            if(player) {
                content += `${player.discord_username} --- ${entry.goals} goals\n`;
            }
        }

        message.channel.send(content, { split: true });

  }
};