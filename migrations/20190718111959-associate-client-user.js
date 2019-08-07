'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Client_Owners', {
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          },
          client_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          }
        }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Client_Owners');
  }
};
