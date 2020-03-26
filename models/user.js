'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    shikimori_id: DataTypes.STRING,
    name: DataTypes.STRING,
    login: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    scopes: DataTypes.ARRAY(DataTypes.STRING)
  }, {
    updatedAt: false
  });
  User.associate = function(models) {};

  return User;
};
