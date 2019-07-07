module.exports = {
  development: {
    username: "postgres",
    password: null,
    database: "myhutdb",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: null,
    database: "myhutdb_test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres"
  }
};
