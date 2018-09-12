import * as Sequelize from 'sequelize';
import { BaseModelInterface } from '../interfaces/BaseModelInterface';
import { ModelsInterface } from '../interfaces/ModelsInterface';
import { PostAttributes, PostInstance } from '../interfaces/Post.interface';

export interface PostModel
  extends BaseModelInterface,
    Sequelize.Model<PostInstance, PostAttributes> {}

export default (
  sequelize: Sequelize.Sequelize,
  DataTypes: Sequelize.DataTypes
): PostModel => {
  const Post: PostModel = sequelize.define(
    'Post',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: 'posts'
    }
  );

  Post.associate = (models: ModelsInterface): void => {
    Post.belongsTo(models.User, {
      foreignKey: {
        allowNull: false,
        field: 'author',
        name: 'author'
      }
    });
  };

  return Post;
};
