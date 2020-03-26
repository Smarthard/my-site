'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'shikimori_id', { type: Sequelize.STRING });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'shikimori_id');
  }
};
