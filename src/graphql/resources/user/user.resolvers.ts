import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { AuthUser } from '../../../interfaces/AuthUserInterface';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { UserInstance } from '../../../interfaces/User.interface';
import { handleError, throwError } from '../../../utils/utils';
import { authResolvers } from '../../composable/auth.resolver';
import { compose } from '../../composable/composable.resolver';

export const userResolvers = {
  User: {
    posts: (parent: UserInstance, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Post.findAll({
        where: { author: parent.get('id') },
        limit: first,
        offset: offset
      }).catch(handleError);
    }
  },

  Query: {
    users: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.User.findAll({
        limit: first,
        offset: offset
      }).catch(handleError);
    },

    user: (parent, params, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
      return db.User.findById(authUser.id)
        .then((user: UserInstance) => {
          throwError(!user, `User with ID ${authUser.id} not found!`);
          return user;
        })
        .catch(handleError);
    },

    currentUser: compose(...authResolvers)(
      (parent, params, { db, authUser }: { db: DbConnection; authUser: AuthUser }, info: GraphQLResolveInfo) => {
        return db.User.findById(authUser.id)
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
