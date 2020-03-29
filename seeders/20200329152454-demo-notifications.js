'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Notifications', [
      {
        id: 0,
        info: JSON.stringify({
          name: 'Довольно таки длинное название для уведомления',
          html: 'Ну, что сказать, HTML хранить в базе - <b>это норма</b>' +
              '<p>Зацени, еще и ссылку на ' +
              '<a class="shc-links" href="https://shikimori.one/" target="_blank">шикимори</a>' +
              ' можно вставить</p>'
        }),
        createdAt: new Date(1585414406348),
        expires: new Date(),
        min_version: [0, 7, 6],
        max_version: null
      },
      {
        id: 2,
        info: JSON.stringify({
          name: 'А это короче'
        }),
        createdAt: new Date(1585414397913),
        expires: new Date(),
        min_version: [0, 8, 0],
        max_version: [0, 8, 0]
      },
      {
        id: 200,
        info: JSON.stringify({
          name: 'Another one'
        }),
        createdAt: new Date(1585414389738),
        expires: new Date(),
        min_version: [0, 8, 0],
        max_version: [0, 8, 0]
      },
      {
        id: 2003,
        info: JSON.stringify({
          name: 'And another one'
        }),
        createdAt: new Date(1585414380640),
        expires: new Date(),
        min_version: [0, 8, 0],
        max_version: [0, 8, 0]
      },
      {
        id: 20033,
        info: JSON.stringify({
          name: 'And another one'
        }),
        createdAt: new Date(1585414326922),
        expires: new Date(),
        min_version: [0, 8, 0],
        max_version: [0, 8, 0]
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Notifications', null, {})
  }
};
