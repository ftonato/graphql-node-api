import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { AuthUser } from '../../../interfaces/AuthUserInterface';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { ResolverContext } from '../../../interfaces/ResolverContextInterface';
import { UserInstance } from '../../../interfaces/User.interface';
import { handleError, throwError } from '../../../utils/utils';
import { RequestedFields } from '../../ast/RequestedFields';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';

export const userResolvers = {
  User: {
    posts: (
      parent: UserInstance,
      { first = 10, offset = 0 },
      { db, requestedFields }: { db: DbConnection; requestedFields: RequestedFields },
      info: GraphQLResolveInfo
    ) => {
      return db.Post.findAll({
        where: { author: parent.get('id') },
        limit: first,
        offset: offset,
        attributes: requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] })
      }).catch(handleError);
    }
  },

  Query: {
    users: (parent, { first = 10, offset = 0 }, context: ResolverContext, info: GraphQLResolveInfo) => {
      return context.db.User.findAll({
        limit: first,
        offset: offset,
        attributes: context.requestedFields.getFields(info, { keep: ['id'], exclude: ['posts'] })
      }).catch(handleError);
    },

    user: (parent, { id }, { db, requestedFields }: { db: DbConnection; requestedFields: RequestedFields }, info: GraphQLResolveInfo) => {
      id = parseInt(id);
      return db.User.findById(id, { attributes: requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] }) })
        .then((user: UserInstance) => {
          throwError(!user, `User with ID ${id} not found!`);
          return user;
        })
        .catch(handleError);
    },

    currentUser: compose(...authResolvers)(
      (
        parent,
        params,
        { db, authUser, requestedFields }: { db: DbConnection; authUser: AuthUser; requestedFields: RequestedFields },
        info: GraphQLResolveInfo
      ) => {
        return db.User.findById(authUser.id, { attributes: requestedFields.getFields(info, { keep: ['id'], exclude: ['comments'] }) })
          .then((user: UserInstance) => {
            throwError(!user, `User with ID ${authUser.id} not found!`);

            return user;
          })
          .catch(handleError);
      }
    )
  },

  Mutation: {
    createUser: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.sequelize
        .transaction((transaction: Transaction) => {
          return db.User.create(input, { transaction });
        })
        .catch(handleError);
    },

    updateUser: compose(...authResolvers)(
      (parent, { input }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.User.findById(authUser.id).then((user: UserInstance) => {
              throwError(!user, `User with ID ${authUser.id} not found!`);

              return user.update(input, { transaction });
            });
          })
          .catch(handleError);
      }
    ),
    updateUserPassword: compose(...authResolvers)(
      (parent, { input }, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.User.findById(authUser.id).then((user: UserInstance) => {
              throwError(!user, `User with ID ${authUser.id} not found!`);

              return user.update(input, { transaction }).then((user: UserInstance) => {
                return !!user;
              });
            });
          })
          .catch(handleError);
      }
    ),
    deleteUser: compose(...authResolvers)(
      (parent, params, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        return db.sequelize
          .transaction((transaction: Transaction) => {
            return db.User.findById(authUser.id).then((user: UserInstance) => {
              throwError(!user, `User with ID ${authUser.id} not found!`);

              return user.destroy({ transaction }).then(user => {
                return !!user;
              });
            });
          })
          .catch(handleError);
      }
    )
  }
};
