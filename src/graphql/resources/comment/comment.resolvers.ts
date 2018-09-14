import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { AuthUser } from '../../../interfaces/AuthUserInterface';
import { CommentInstance } from '../../../interfaces/Comment.interface';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { handleError, throwError } from '../../../utils/utils';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';

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
    createComment: compose(...authResolvers)(
      (parent, { input }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        input.user = authUser.id;

        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.Comment.create(input, { transaction });
          })
          .catch(handleError);
      }
    ),

    updateComment: compose(...authResolvers)(
      (parent, { id, input }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        id = parseInt(id);

        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.Comment.findById(id).then((comment: CommentInstance) => {
              throwError(!comment, `Comment with ID ${id} not found!`);
              throwError(comment.get('user') != authUser.id, 'Unauthorized! You can edit comments by yourself!');

              input.user = authUser.id;
              return comment.update(input, { transaction });
            });
          })
          .catch(handleError);
      }
    ),
    deleteComment: compose(...authResolvers)(
      (parent, { id }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        id = parseInt(id);

        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.Comment.findById(id).then((comment: CommentInstance) => {
              throwError(!comment, `Comment with ID ${id} not found!`);
              throwError(comment.get('user') != authUser.id, 'Unauthorized! You can delete comments by yourself!');

              return comment.destroy({ transaction }).then(comment => {
                return !!comment;
              });
            });
          })
          .catch(handleError);
      }
    )
  }
};
