import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { PostInstance } from '../../../interfaces/Post.interface';
import { handleError } from '../../../utils/utils';

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
          if (!post) {
            throw new Error(`Post with ID ${id} not found!`);
          }
          return post;
        })
        .catch(handleError);
    }
  },

  Mutation: {
    createPost: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.Post.create(input, { transaction });
        })
        .catch(handleError);
    },

    updatePost: (parent, { id, input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.Post.findById(id).then((post: PostInstance) => {
            if (!post) {
              throw new Error(`Post with ID ${id} not found!`);
            }

            return post.update(input, { transaction });
          });
        })
        .catch(handleError);
    },
    deletePost: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.Post.findById(id).then((post: PostInstance) => {
            if (!post) {
              throw new Error(`Post with ID ${id} not found!`);
            }

            return post.destroy({ transaction }).then(post => {
              return !!post;
            });
          });
        })
        .catch(handleError);
    }
  }
};