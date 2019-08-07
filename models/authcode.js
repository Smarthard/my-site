'use strict';
module.exports = (sequelize, DataTypes) => {
  const AuthCode = sequelize.define('AuthCode', {
    client_id: DataTypes.STRING,
    auth_code: DataTypes.STRING,
    redirect_uri: DataTypes.STRING,
    scopes: DataTypes.ARRAY(DataTypes.STRING),
    user_id: DataTypes.STRING,
    expires: DataTypes.DATE
  }, {
    timestamps: false
  });
  AuthCode.associate = function(models) {

  };
  return AuthCode;
};
