import * as Sequelize from 'sequelize';

export interface CommentAttributes {
  id?: number;
  comment?: string;
  user?: number;
  post?: number;
}

export interface CommentInstance extends Sequelize.Instance<CommentAttributes> {}
