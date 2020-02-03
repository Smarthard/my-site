'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      target_id: {
        type: Sequelize.INTEGER
      },
      requester: {
        type: Sequelize.STRING,
        allowNull: false
      },
      request: {
        type: Sequelize.JSON,
        allowNull: false
      },
      old: {
        type: Sequelize.JSON
      },
      approved: {
        type: Sequelize.BOOLEAN
      },
      reviewer_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      reviewed: {
        type: Sequelize.DATE
      },
      feedback: {
        type: Sequelize.STRING
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Requests');
  }
};
