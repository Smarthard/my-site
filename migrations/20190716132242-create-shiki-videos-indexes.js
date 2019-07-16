'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex(
          'ShikiVideos',
          ['anime_id'],
          {
            name: 'AnimeId_Index'
          }
      ),
      queryInterface.addIndex(
          'ShikiVideos',
          ['anime_english', 'anime_russian'],
          {
            name: 'AnimeTitle_Index'
          }
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
        queryInterface.removeIndex('ShikiVideos', 'AnimeId_Index'),
        queryInterface.removeIndex('ShikiVideos', 'AnimeTitle_Index')
    ])
  }
};
