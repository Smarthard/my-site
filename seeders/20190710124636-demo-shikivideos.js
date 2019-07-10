'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

      return queryInterface.bulkInsert('ShikiVideos', [
        {
          id:527682,
          url: 'http://video.sibnet.ru/shell.php?videoid=1321624',
          anime_id: 21,
          anime_english: 'One Piece',
          anime_russian: 'Ван-Пис',
          episode: 621,
          kind: 'субтитры',
          language: 'russian',
          quality: 'unknown',
          author: 'Верт',
          watches_count: 31,
          uploader: ''
        },
        {
          id: 527683,
          url: 'http://video.sibnet.ru/shell.php?videoid=1321690',
          anime_id: 21,
          anime_english: 'One Piece',
          anime_russian: 'Ван-Пис',
          episode: 621,
          kind: 'озвучка',
          language: 'russian',
          quality: 'unknown',
          author: 'блиннуукк',
          watches_count: 45,
          uploader: ''
        }
      ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ShikiVideos', null, {});
  }
};
