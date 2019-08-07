'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Clients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      client_id: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      client_secret: {
        allowNull: false,
        type: Sequelize.STRING
      },
      redirect_uri: {
        type: Sequelize.STRING
      },
      is_trusted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      banned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    })},
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Clients');
  }
};
