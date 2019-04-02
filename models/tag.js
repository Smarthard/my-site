'use strict';
module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    name: DataTypes.STRING
  }, {
    timestamps: false
  });
  Tag.associate = function(models) {
    Tag.belongsToMany(models.Article, {
      through: 'Articles_Tags',
      as: 'tags',
      foreignKey: 'article_id'
    });
  };
  return Tag;
};
