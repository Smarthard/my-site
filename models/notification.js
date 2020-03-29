'use strict';
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    info: DataTypes.JSON,
    expires: DataTypes.DATE,
    min_version: DataTypes.INTEGER,
    max_version: DataTypes.INTEGER
  }, {
    updatedAt: false
  });
  Notification.associate = function(models) {
    // associations can be defined here
  };
  return Notification;
};
