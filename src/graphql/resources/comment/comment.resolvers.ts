import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { AuthUser } from '../../../interfaces/AuthUserInterface';
import { CommentInstance } from '../../../interfaces/Comment.interface';
import { DataLoaders } from '../../../interfaces/DataLoadersInterface';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { handleError, throwError } from '../../../utils/utils';
import { RequestedFields } from '../../ast/RequestedFields';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';

export const commentResolvers = {
  Comment: {
    user: (comment, params, { dataloaders: { userLoader } }: { dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
      return userLoader.load({ key: comment.get('user'), info }).catch(handleError);
    },

    post: (comment, params, { dataloaders: { postLoader } }: { dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
      return postLoader.load({ key: comment.get('post'), info }).catch(handleError);
    }
  },

  Query: {
    commentsByPost: (
      parent,
      { postId, first = 10, offset = 0 },
      { db, requestedFields }: { db: DbConnection; requestedFields: RequestedFields },
      info: GraphQLResolveInfo
    ) => {
      postId = parseInt(postId);

      return db.Comment.findAll({
        where: { post: postId },
        limit: first,
        offset: offset,
        attributes: requestedFields.getFields(info)
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
