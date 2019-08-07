'use strict';
module.exports = (sequelize, DataTypes) => {
  const AccessToken = sequelize.define('AccessToken', {
    token: DataTypes.STRING,
    user_id: DataTypes.STRING,
    client_id: DataTypes.STRING,
    scopes: DataTypes.ARRAY(DataTypes.STRING),
    expires: DataTypes.DATE
  }, {
    timestamps: false
  });
  AccessToken.associate = function(models) {};

  AccessToken.removeAttribute('id');
  return AccessToken;
};
