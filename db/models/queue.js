'use strict';
module.exports = (sequelize, DataTypes) => {
  var Queue = sequelize.define('Queue', {
    identifier: DataTypes.STRING,
    discord_guild_id: DataTypes.STRING,
    type: DataTypes.ENUM('6mans','4mans','2mans'),
    game_mode: DataTypes.ENUM('random','captains','balanced'),
    status: DataTypes.ENUM('created','in_progress','completed'),
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    winner: DataTypes.ENUM('home', 'away'),
    home_team_score: DataTypes.INTEGER,
    away_team_score: DataTypes.INTEGER
  },
  {
    tableName: 'queues',
  	timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  });

  return Queue;
};