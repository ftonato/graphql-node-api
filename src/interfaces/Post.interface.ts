import * as Sequelize from 'sequelize';

export interface PostAttributes {
  id?: number;
  title?: string;
  content?: string;
  author?: number;
}

export interface PostInstance extends Sequelize.Instance<PostAttributes> {}
