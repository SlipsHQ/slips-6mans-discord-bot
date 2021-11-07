const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const moment = require('moment');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'mybets',
	category: 'Everyone',
	description: 'Allows you to view your current and historic bets.',
	usage: `You can use this command to view all your current and historic bets`,
	async execute(message, args) {
		message.reply('Sorry, this feature is not finished yet!');
	},
};

