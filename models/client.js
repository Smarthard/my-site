'use strict';
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    name: DataTypes.STRING,
    client_id: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    client_secret: DataTypes.STRING,
    redirect_uri: DataTypes.STRING,
    is_trusted: DataTypes.BOOLEAN,
    banned: DataTypes.BOOLEAN
  }, {
    timestamps: false
  });
  Client.associate = function(models) {};
  return Client;
};
