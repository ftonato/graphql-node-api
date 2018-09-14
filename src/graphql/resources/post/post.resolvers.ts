import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { AuthUser } from '../../../interfaces/AuthUserInterface';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { PostInstance } from '../../../interfaces/Post.interface';
import { handleError, throwError } from '../../../utils/utils';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';

export const postResolvers = {
  Post: {
    author: (post, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.User.findById(post.get('author')).catch(handleError);
    },

    comments: (post, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Comment.findAll({
        where: {
          post: post.get('id')
        },
        limit: first,
        offset: offset
      }).catch(handleError);
    }
  },

  Query: {
    posts: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Post.findAll({
        limit: first,
        offset: offset
      });
    },

    post: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.Post.findById(id)
        .then((post: PostInstance) => {
          throwError(!post, `Post with ID ${id} not found!`);
          return post;
        })
        .catch(handleError);
    }
  },

  Mutation: {
    createPost: compose(...authResolvers)(
      (parent, { input }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        input.author = authUser.id;

        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.Post.create(input, { transaction });
          })
          .catch(handleError);
      }
    ),

    updatePost: compose(...authResolvers)(
      (parent, { id, input }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        id = parseInt(id);

        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.Post.findById(id).then((post: PostInstance) => {
              throwError(!post, `Post with ID ${id} not found!`);
              throwError(post.get('author') != authUser.id, 'Unauthorized! You can edit posts by yourself!');

              input.author = authUser.id;
              return post.update(input, { transaction });
            });
          })
          .catch(handleError);
      }
    ),
    deletePost: compose(...authResolvers)(
      (parent, { id }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        id = parseInt(id);

        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.Post.findById(id).then((post: PostInstance) => {
              throwError(!post, `Post with ID ${id} not found!`);
              throwError(post.get('author') != authUser.id, 'Unauthorized! You can delete posts by yourself!');

              return post.destroy({ transaction }).then(post => !!post);
            });
          })
          .catch(handleError);
      }
    )
  }
};
