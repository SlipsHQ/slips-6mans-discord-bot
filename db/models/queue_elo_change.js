'use strict';
module.exports = (sequelize, DataTypes) => {
  var QueueEloChange = sequelize.define('QueueEloChange', {
    queue_id: DataTypes.INTEGER,
    player_id: DataTypes.INTEGER,
    starting_elo: DataTypes.INTEGER,
    ending_elo: DataTypes.INTEGER,
    difference: DataTypes.INTEGER
  },
  {
  	tableName: 'queue_elo_changes',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  });

  return QueueEloChange;
};