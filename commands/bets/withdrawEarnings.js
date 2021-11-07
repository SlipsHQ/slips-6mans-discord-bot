const path = require("path") 
const config = require(path.join(process.cwd(), 'config', 'config.json'));
const models  = require(path.join(process.cwd(), 'db', 'models')); 
const Op = models.Sequelize.Op;
const moment = require('moment');

const AuthService = require(path.join(process.cwd(), 'services', 'auth.js'));

module.exports = {
	name: 'withdrawearnings',
	category: 'Everyone',
	description: 'Allows you to withdraw your earnings for a bet.',
	usage: `You can use this command to withdraw your bet earnings for a queue, presuming the queue has ended and you won the bet`,
	async execute(message, args) {
		message.reply('Sorry, this feature is not finished yet!');
	},
};

