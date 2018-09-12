import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import * as Sequelize from 'sequelize';
import { BaseModelInterface } from '../interfaces/BaseModelInterface';
import { UserAttributes, UserInstance } from '../interfaces/User.interface';

export interface UserModel
  extends BaseModelInterface,
    Sequelize.Model<UserInstance, UserAttributes> {}

export default (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes
): UserModel => {
  const User: UserModel = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: {
          notEmpty: true
        }
      }
    },
    {
      tableName: 'users',
      hooks: {
        beforeCreate: (
          user: UserInstance,
          options: Sequelize.CreateOptions
        ): void => {
          const salt = genSaltSync();
          user.password = hashSync(user.password, salt);
        }
        // beforeUpdate: (user: UserInstance, options: Sequelize.CreateOptions): void => {
        //     if (user.changed('password')) {
        //         const salt = genSaltSync();
        //         user.password = hashSync(user.password, salt);
        //     }
        // }
      }
    }
  );

  // User.associate = (models: ModelsInterface): void => {};

  User.prototype.isPassword = (
    encodedPassword: string,
    password: string
  ): boolean => {
    return compareSync(password, encodedPassword);
  };

  return User;
};
