import { GraphQLResolveInfo } from 'graphql';
import { Transaction } from 'sequelize';
import { DbConnection } from '../../../interfaces/DbConnection.interface';
import { UserInstance } from '../../../interfaces/User.interface';

export const userResolvers = {
  User: {
    posts: (parent: UserInstance, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Post.findAll({
        where: { author: parent.get('id') },
        limit: first,
        offset: offset
      });
    }
  },

  Query: {
    users: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.User.findAll({
        limit: first,
        offset: offset
      });
    },

    user: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.User.findById(id).then((user: UserInstance) => {
        if (!user) {
          throw new Error(`User with ID ${id} not found!`);
        }
        return user;
      });
    }
  },

  Mutation: {
    createUser: (parent, { input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.sequelize.transaction((transaction: Transaction) => {
        return db.User.create(input, { transaction });
      });
    },

    updateUser: (parent, { id, input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize.transaction((transaction: Transaction) => {
        return db.User.findById(id).then((user: UserInstance) => {
          if (!user) {
            throw new Error(`User with ID ${id} not found!`);
          }

          return user.update(input, { transaction });
        });
      });
    },
    updateUserPassword: (parent, { id, input }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      this.updateUser(parent, { id, input }, { db }, info).then((user: UserInstance) => {
        return !!user;
      });
    },
    deleteUser: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize.transaction((transaction: Transaction) => {
        return db.User.findById(id).then((user: UserInstance) => {
          if (!user) {
            throw new Error(`User with ID ${id} not found!`);
          }

          return user.destroy({ transaction }).then(user => {
            return !!user;
          });
        });
      });
    }
  }
};
