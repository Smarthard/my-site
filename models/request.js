'use strict';
module.exports = (sequelize, DataTypes) => {
  const Request = sequelize.define('Request', {
    type: DataTypes.STRING,
    target_id: DataTypes.INTEGER,
    requester: DataTypes.STRING,
    comment: DataTypes.STRING,
    request: DataTypes.JSON,
    old: DataTypes.JSON,
    approved: DataTypes.BOOLEAN,
    reviewer_id: DataTypes.INTEGER,
    reviewed: DataTypes.DATE,
    feedback: DataTypes.STRING
  }, {
    timestamps: true,
    updatedAt: false
  });
  Request.associate = function(models) {
    // associations can be defined here
  };
  return Request;
};
