const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
  name: 'mostsaves',
  description: 'Produces a list of top shot savers',
  usage: `Use this command to view a list of the top 20 players in descending order rated by the number of shots they've saved`,
  category: 'Everyone',
  async execute(message, args) {

  
        const title = 'The top 20 shot savers at the moment are'

        let content = '';

        const entries = await models.QueueParticipant.findAll({
            attributes: [['any_value(id)', 'id'], ['sum(saves)','saves'], 'player_id'],
            order: [
                ['saves', 'DESC']
            ],
            group: ['player_id', 'saves'],
            limit: 20
        });

        content += `\n:small_blue_diamond: **${title}:** :small_blue_diamond:\n`;

        for(var entry of entries) {
            var player = await models.Player.findByPk(entry.player_id)
            if(player) {
                content += `${player.discord_username} --- ${entry.saves} saves\n`;
            }
        }

        message.channel.send(content, { split: true });

  }
};