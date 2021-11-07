const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const moment = require('moment');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'placebet',
	category: 'Everyone',
	description: 'Allows you to place a bet on a queue.',
	usage: `You can use this command to place a bet on a queue.`,
	async execute(message, args) {
		message.reply('Sorry, this feature is not finished yet!');

		// content += `**${matchDate.format('ddd Do MMM @ h:mm a')} ET** [${round.name}]: ${homeTeam.name} (${homeTeamScore}) vs (${awayTeamScore}) ${awayTeam.name} \n`;
		// content += `    ${slcc} Current Betting Pool Total **${CreditService.formatThousands(total)}**\n`;
		// content += `    ${slcc} Wagered on ${homeTeam.name} **${CreditService.formatThousands(homeTeamBets)}**\n`;
		// content += `    ${slcc} Wagered on ${awayTeam.name} **${CreditService.formatThousands(awayTeamBets)}**\n`;
		// content += `    _to view a report on this fixture type \`!viewfixturereport ${fixture.id}\`_\n`;
		// content += `    _to place a bet on this fixture type \`!placebet ${fixture.id}\`_\n\n`;
	},
};

