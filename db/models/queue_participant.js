'use strict';
module.exports = (sequelize, DataTypes) => {
  var QueueParticipant = sequelize.define('QueueParticipant', {
    queue_id: DataTypes.INTEGER,
    player_id: DataTypes.INTEGER,
    team: DataTypes.ENUM('home', 'away'),
    is_captain: DataTypes.BOOLEAN,
    goals: DataTypes.INTEGER,
    assists: DataTypes.INTEGER,
    saves: DataTypes.INTEGER,
    shots: DataTypes.INTEGER,
  },
  {
    tableName: 'queue_participants',
  	timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  });

  return QueueParticipant;
};