'use strict';
module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    token: DataTypes.STRING,
    user_id: DataTypes.STRING,
    client_id: DataTypes.STRING,
    scopes: DataTypes.ARRAY(DataTypes.STRING),
    expires: DataTypes.DATE
  }, {
    timestamps: false
  });
  RefreshToken.associate = function(models) {};

  RefreshToken.removeAttribute('id');
  return RefreshToken;
};
