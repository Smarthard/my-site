'use strict';

let uuid = require('uuid');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Clients', [
      {
        client_id: uuid(),
        name: 'trusted client',
        client_secret: 'trusted',
        user_id: '1',
        redirect_uri: 'http://127.0.0.1:4200',
        is_trusted: true,
        banned: false
      },
      {
        client_id: uuid(),
        name: 'common client',
        client_secret: 'common',
        user_id: '1',
        redirect_uri: 'http://127.0.0.1:4200',
        is_trusted: false,
        banned: false
      },
      {
        client_id: uuid(),
        name: 'banned client',
        client_secret: 'banned',
        user_id: '1',
        redirect_uri: 'http://127.0.0.1:4200',
        is_trusted: false,
        banned: true
      },
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Clients', null, {});
  }
};
