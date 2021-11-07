const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
  name: 'mostwealthiest',
  description: 'Produces a list of wealthiest players',
  usage: `Use this command to view a list of the top 20 players in descending order rated by the amount of credits they have accumulated`,
  category: 'Everyone',
  async execute(message, args) {

  
        const title = 'The top 20 wealthiest players at the moment are'

        let content = '';

        const entries = await models.Player.findAll({
            order: [
                ['credits', 'DESC']
            ],
            limit: 20
        });

        content += `\n:small_blue_diamond: **${title}:** :small_blue_diamond:\n`;

        for(var entry of entries) {
            content += `${entry.discord_username} --- ${entry.credits} credits\n`;
        }

        message.channel.send(content, { split: true });

  }
};