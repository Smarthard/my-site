'use strict';
module.exports = (sequelize, DataTypes) => {
  const ShikiVideos = sequelize.define('ShikiVideos', {
    url: DataTypes.STRING,
    anime_id: DataTypes.STRING,
    anime_english: DataTypes.STRING,
    anime_russian: DataTypes.STRING,
    episode: DataTypes.INTEGER,
    kind: DataTypes.STRING,
    language: DataTypes.STRING,
    quality: DataTypes.STRING,
    author: DataTypes.STRING,
    watches_count: DataTypes.INTEGER,
    uploader: DataTypes.STRING
  }, {
    timestamps: false,
    updatedAt: false
  });
  ShikiVideos.associate = function(models) {
    // associations can be defined here
  };
  return ShikiVideos;
};
