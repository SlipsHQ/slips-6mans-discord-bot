'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([

        // players
        queryInterface.createTable('players', {
          id: {   
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          guild_id: { type: Sequelize.INTEGER, allowNull: false },
          discord_id: { type: Sequelize.STRING, allowNull: false,  },
          discord_username: { type: Sequelize.STRING, allowNull: false },
          standard_rank: { type: Sequelize.STRING, allowNull: false, defaultValue: 'bronze_1' },
          standard_division: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          standard_mmr: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          standard_elo_mmr: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          doubles_rank: { type: Sequelize.STRING, allowNull: false, defaultValue: 'bronze_1' },
          doubles_division: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          doubles_mmr: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          doubles_elo_mmr: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          duel_rank: { type: Sequelize.STRING, allowNull: false, defaultValue: 'bronze_1' },
          duel_division: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          duel_mmr: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          duel_elo_mmr: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          platform: { type: Sequelize.ENUM('epic', 'xbl', 'psn', 'steam'), allowNull: false },
          gamer_id: { type: Sequelize.STRING, allowNull: false },
          bio: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
          credits: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5000 },
          twitter_link: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
          receive_notifications: { type: Sequelize.BOOLEAN, defaultValue: false},
          '6mans_played': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '6mans_won': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '6mans_lost': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '4mans_played': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '4mans_won': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '4mans_lost': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '2mans_played': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '2mans_won': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          '2mans_lost': { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          created_at: { type: Sequelize.DATE },
          updated_at: { type: Sequelize.DATE },
          deleted_at: { type: Sequelize.DATE }
        }),

        // guilds
        queryInterface.createTable('guilds', {
          id: {   
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          discord_guild_id: { type: Sequelize.STRING, allowNull: false },
          name: { type: Sequelize.STRING, allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
          invite_url: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
          prefix: { type: Sequelize.STRING, allowNull: false, defaultValue: '!' },
          owner_discord_id: { type: Sequelize.STRING, allowNull: false },
          created_at: { type: Sequelize.DATE },
          updated_at: { type: Sequelize.DATE },
          deleted_at: { type: Sequelize.DATE }
        }),

        // queues
        queryInterface.createTable('queues', {
          id: {   
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          identifier: { type: Sequelize.STRING, allowNull: false },
          discord_guild_id: { type: Sequelize.STRING, allowNull: false },
          type: { type: Sequelize.ENUM('6mans', '4mans', '2mans'), allowNull: false, defaultValue: '6mans' },
          game_mode: { type: Sequelize.ENUM('random', 'captains', 'balanced'), allowNull: false, defaultValue: 'random' },
          status: { type: Sequelize.ENUM('created', 'in_progress', 'completed'), allowNull: false, defaultValue: 'created' },
          username: { type: Sequelize.STRING, allowNull: true },
          password: { type: Sequelize.STRING, allowNull: true },
          winner: { type: Sequelize.ENUM('home', 'away'), allowNull: true },
          home_team_score: { type: Sequelize.INTEGER, allowNull: true },
          away_team_score: { type: Sequelize.INTEGER, allowNull: true },
          created_at: { type: Sequelize.DATE },
          updated_at: { type: Sequelize.DATE },
          deleted_at: { type: Sequelize.DATE }
        }),

        // queue_participants
        queryInterface.createTable('queue_participants', {
          id: {   
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          queue_id: { type: Sequelize.INTEGER, allowNull: false },
          player_id: { type: Sequelize.INTEGER, allowNull: false },
          team: { type: Sequelize.ENUM('home', 'away'), allowNull: true, defaultValue: null },
          is_captain: { type: Sequelize.BOOLEAN, defaultValue: false},
          goals: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          assists: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          saves: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          shots: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          created_at: { type: Sequelize.DATE },
          updated_at: { type: Sequelize.DATE },
          deleted_at: { type: Sequelize.DATE }
        }),


        // queue_elo_changes
        queryInterface.createTable('queue_elo_changes', {
          id: {   
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          queue_id: { type: Sequelize.INTEGER, allowNull: false },
          player_id: { type: Sequelize.INTEGER, allowNull: false },
          starting_elo: { type: Sequelize.INTEGER, defaultValue: 0 },
          ending_elo: { type: Sequelize.INTEGER, defaultValue: 0 },
          difference: { type: Sequelize.INTEGER, defaultValue: 0 },
          created_at: { type: Sequelize.DATE },
          updated_at: { type: Sequelize.DATE },
          deleted_at: { type: Sequelize.DATE }
        }),

    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
        queryInterface.dropTable('players'),
        queryInterface.dropTable('guilds'),
        queryInterface.dropTable('queues'),
        queryInterface.dropTable('queue_participants'),
        queryInterface.dropTable('queue_elo_changes'),
    ])
  }
};