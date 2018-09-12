export interface DbConfig {
  [env: string]: {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: string;
  };
}
