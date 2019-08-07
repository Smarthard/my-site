'use strict';

let bcrypt = require('bcrypt');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Users', [
      {
        name: 'Banhammerov Admin Moderatovich',
        login: 'admin',
        password: bcrypt.hashSync('admin', 10),
        email: 'admin@example.com',
        scopes: ['admin']
      },
      {
        name: 'User #1',
        login: 'user1',
        password: bcrypt.hashSync('user', 10),
        email: 'user1@example.com',
        scopes: ['user']
      },
      {
        name: 'User #2',
        login: 'user2',
        password: bcrypt.hashSync('user', 10),
        email: 'user2@example.com',
        scopes: ['user', 'banned']
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
