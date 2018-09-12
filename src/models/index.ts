import * as fs from 'fs';
import * as path from 'path';
import * as Sequelize from 'sequelize';
import { DbConfig } from '../interfaces/DbConfig.interface';
import { DbConnection } from '../interfaces/DbConnection.interface';

const basename: string = path.basename(module.filename);
const env: string = process.env.NODE_ENV || 'development';

const config: DbConfig = require(path.resolve(
  `${__dirname}./../config/config.json`
));
let db = null;

if (!db) {
  db = {};

  const operatorsAliases = {
    $in: Sequelize.Op.in
  };

  const storage = `${__dirname}/../config/graphql_development.sqlite`;

  const sequelize: Sequelize.Sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    { ...config[env], storage, operatorsAliases }
  );

  fs.readdirSync(__dirname)
    .filter((file: string) => {
      return (
        file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
      );
    })
    .forEach((file: string) => {
      const model = sequelize.import(path.join(__dirname, file));
      db[model['name']] = model;
    });

  Object.keys(db).forEach((modelName: string) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db['sequelize'] = sequelize;
}

export default db as DbConnection;
