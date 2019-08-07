'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('RefreshTokens', {
      token: {
        primaryKey: true,
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.STRING
      },
      client_id: {
        type: Sequelize.STRING
      },
      scopes: {
        allowNull: false,
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      expires: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RefreshTokens');
  }
};
