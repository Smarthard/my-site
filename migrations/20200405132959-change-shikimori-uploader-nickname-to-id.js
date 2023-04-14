'use strict';
const axios = require('axios');
const ShikiVideos = require('../models').ShikiVideos;

function getShikimoriUserId(username) {
  const uri = encodeURI(`https://shikimori.me/api/users/${username}`);
  const params = { is_nickname: 1 };
  const headers = { 'User-Agent': 'Shikicinema DB; smarthard.net; parsing legacy uploaders nicknames' };

  if (!username)
    return null;

  return axios.get(uri, { params, headers })
      .then((res) => res.data)
      .then((user) => {
        console.log(`[Migration log] '${username}' successfully changed to ${user.id}`);

        if (!user || !user.id) {
          throw new Error('User without id!');
        }

        return user.id
      })
      .catch(() => {
        console.error(`[Migration log] '${username}' not found, try: https://shikimori.me/${encodeURI(username)}`);
        return username;
      });
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const USER_MAP = new Map();
    const videos = await ShikiVideos.findAll({ where: {
        [Sequelize.Op.and]: [
          {
            // uploader is not a number
            uploader: { [Sequelize.Op.notRegexp]: '^[0-9]+$' }
          },
          {
            // or null
            uploader: { [Sequelize.Op.not]: null }
          },
          {
            // select from records of shikimori, not shikicinema
            id: { [Sequelize.Op.lte]: 1963553 }
          }
        ]
      }
    });
    const USERS = [...new Set(videos.map(v => `${v.uploader}`))].sort();
    let delay = 0;
    let updatedVideos = [];
    let shikimoriUsersQueries = [];

    USERS.forEach((user, index) => {
      shikimoriUsersQueries.push(
          new Promise(resolve => setTimeout(resolve, delay))
              .then(async () => {
                let uploaderId = USER_MAP.get(user);

                if (!uploaderId) {
                  uploaderId = await getShikimoriUserId(user);
                  USER_MAP.set(user, uploaderId);
                }
              })
      );

      if (index % 3 === 0) {
        delay += 3000;
      }
    });

    await Promise
        .all(shikimoriUsersQueries)
        .then(() => {
          videos.forEach((video) => {
            let updated = video.dataValues;
            updated.uploader = USER_MAP.get(video.uploader);
            updatedVideos.push(updated);
          });

          ShikiVideos.bulkCreate(updatedVideos, { updateOnDuplicate: ['id', 'uploader'] })
              .then(() => console.log('db updated'))
              .catch(err => console.error('db update error', err));
        })
        .catch((err) => console.error('promises error', err));

    return queryInterface.showAllTables();
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.showAllTables();
  }
};
