'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ShikiVideos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      url: {
        allowNull: false,
        type: Sequelize.STRING
      },
      anime_id: {
        allowNull: false,
        type: Sequelize.STRING
      },
      anime_english: {
        allowNull: false,
        type: Sequelize.STRING
      },
      anime_russian: {
        type: Sequelize.STRING
      },
      episode: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      kind: {
        type: Sequelize.STRING
      },
      language: {
        type: Sequelize.STRING
      },
      quality: {
        type: Sequelize.STRING
      },
      author: {
        type: Sequelize.STRING
      },
      watches_count: {
        type: Sequelize.INTEGER
      },
      uploader: {
        type: Sequelize.STRING
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ShikiVideos');
  }
};
