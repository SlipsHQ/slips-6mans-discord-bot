'use strict';
module.exports = (sequelize, DataTypes) => {
  var Player = sequelize.define('Player', {
    guild_id: DataTypes.STRING,
    discord_id: DataTypes.STRING,
    discord_username: DataTypes.STRING,
    standard_rank: DataTypes.STRING,
    standard_division: DataTypes.INTEGER,
    standard_mmr: DataTypes.INTEGER,
    standard_elo_mmr: DataTypes.INTEGER,
    doubles_rank: DataTypes.STRING,
    doubles_division: DataTypes.INTEGER,
    doubles_mmr: DataTypes.INTEGER,
    doubles_elo_mmr: DataTypes.INTEGER,
    duel_rank: DataTypes.STRING,
    duel_division: DataTypes.INTEGER,
    duel_mmr: DataTypes.INTEGER,
    duel_elo_mmr: DataTypes.INTEGER,
    platform: DataTypes.ENUM('epic','xbl','psn','steam'),
    gamer_id: DataTypes.STRING,
    bio: DataTypes.TEXT,
    credits: DataTypes.INTEGER,
    twitter_link: DataTypes.STRING,
    receive_notifications: DataTypes.BOOLEAN,
    '6mans_played': DataTypes.INTEGER,
    '6mans_won': DataTypes.INTEGER,
    '6mans_lost': DataTypes.INTEGER,
    '4mans_played': DataTypes.INTEGER,
    '4mans_won': DataTypes.INTEGER,
    '4mans_lost': DataTypes.INTEGER,
    '2mans_played': DataTypes.INTEGER,
    '2mans_won': DataTypes.INTEGER,
    '2mans_lost': DataTypes.INTEGER,
  },
  {
    tableName: 'players',
  	timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  });

  return Player;
};