import * as Sequelize from 'sequelize';
import { BaseModelInterface } from '../interfaces/BaseModelInterface';
import { CommentAttributes, CommentInstance } from '../interfaces/Comment.interface';
import { ModelsInterface } from '../interfaces/ModelsInterface';

export interface CommentModel extends BaseModelInterface, Sequelize.Model<CommentInstance, CommentAttributes> {}

export default (sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes): CommentModel => {
  const Comment: CommentModel = sequelize.define(
    'Comment',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: 'comments'
    }
  );

  Comment.associate = (models: ModelsInterface): void => {
    Comment.belongsTo(models.Post, {
      foreignKey: {
        allowNull: false,
        field: 'post',
        name: 'post'
      }
    });

    Comment.belongsTo(models.User, {
      foreignKey: {
        allowNull: false,
        field: 'user',
        name: 'user'
      }
    });
  };

  return Comment;
};
