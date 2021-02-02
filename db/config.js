const { DB_HOST, DB_NAME, DB_PASSWORD, DB_USERNAME, DB_PORT } = process.env;

const sequelizeConfig = {
  dialect: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  logging: false,
  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeData',
};

module.exports = sequelizeConfig;
