'use strict';
module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    name: DataTypes.STRING,
    text: DataTypes.TEXT
  }, {
    timestamps: true,
    updatedAt: false
  });
  Article.associate = function(models) {
    Article.belongsToMany(models.Tag, {
      through: 'Articles_Tags',
      as: 'articles',
      foreignKey: 'tag_id'
    })
  };
  return Article;
};
