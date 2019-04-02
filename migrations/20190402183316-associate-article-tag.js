'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Articles_Tags', {
          article_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          },
          tag_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          }
        }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Articles_Tags');
  }
};
