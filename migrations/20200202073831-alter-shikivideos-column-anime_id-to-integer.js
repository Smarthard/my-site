'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('ShikiVideos', 'anime_id', {
      type: 'INTEGER USING CAST("anime_id" as INTEGER)',
      allowNull: false
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('ShikiVideos', 'anime_id', {
      type: 'VARCHAR USING CAST("anime_id" as VARCHAR)'
    })
  }
};
