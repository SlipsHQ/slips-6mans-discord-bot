'use strict';
module.exports = (sequelize, DataTypes) => {
  var Guild = sequelize.define('Guild', {
    discord_guild_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    invite_url: DataTypes.STRING,
    prefix: DataTypes.STRING,
    owner_discord_id: DataTypes.STRING,
  },
  {
    tableName: 'guilds',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  });

  return Guild;
};