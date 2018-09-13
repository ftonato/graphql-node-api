import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { CommentInstance } from '../../../interfaces/Comment.interface';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { handleError } from '../../../utils/utils';

export const commentResolvers = {
  Comment: {
    user: (comment, params, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.User.findById(comment.get('author')).catch(handleError);
    },

    post: (comment, params, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Comment.findById(comment.get('post')).catch(handleError);
    }
  },

  Query: {
    commentsByPost: (parent, { postId, first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      postId = parseInt(postId);

      return db.Comment.findAll({
        where: { post: postId },
        limit: first,
        offset: offset
      }).catch(handleError);
    }
  },

  Mutation: {
    createComment: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.Comment.create(input, { transaction });
        })
        .catch(handleError);
    },

    updateComment: (parent, { id, input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.Comment.findById(id).then((comment: CommentInstance) => {
            if (!comment) {
              throw new Error(`Comment with ID ${id} not found!`);
            }

            return comment.update(input, { transaction });
          });
        })
        .catch(handleError);
    },
    deleteComment: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.Comment.findById(id).then((comment: CommentInstance) => {
            if (!comment) {
              throw new Error(`Comment with ID ${id} not found!`);
            }

            return comment.destroy({ transaction }).then(comment => {
              return !!comment;
            });
          });
        })
        .catch(handleError);
    }
  }
};
