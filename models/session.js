'use strict';
module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    sid: DataTypes.STRING,
    sess: DataTypes.JSON,
    expire: DataTypes.DATE,
  }, {
    timestamps: false
  });
  Session.associate = function(models) {
    // associations can be defined here
  };
  return Session;
};
