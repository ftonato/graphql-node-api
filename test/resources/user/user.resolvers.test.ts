import * as jwt from 'jsonwebtoken';
import { beforeEach, it } from 'mocha';
import { UserInstance } from '../../../src/interfaces/User.interface';
import { JWT_SECRET } from '../../../src/utils/utils';
import { app, chai, db, expect, handleError } from './../../test-utils';

describe('User', () => {
  let userID: number;
  let token: string;

  beforeEach(() => {
    return db.Comment.destroy({ where: {} })
      .then(() => db.Post.destroy({ where: {} }))
      .then(() => {
        db.User.destroy({ where: {} });
      })
      .then(() => {
        return db.User.bulkCreate([
          {
            name: 'Petter',
            email: 'petter@guardians.com',
            password: '147258'
          },
          {
            name: 'Gunz',
            email: 'gunz@guardians.com',
            password: '147369'
          },
          {
            name: 'Lilith',
            email: 'lilith@hellz.org',
            password: '258369'
          }
        ]).then((users: UserInstance[]) => {
          userID = users[0].get('id');

          const payload = { sub: userID };
          token = jwt.sign(payload, JWT_SECRET);
        });
      });
  });

  describe('Queries', () => {
    describe('application/json', () => {
      describe('users', () => {
        it('should return a list of Users', () => {
          const body = {
            query: `query {
              users {
                name
                email
              }
            }`
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const usersList = response.body.data.users;

              expect(response.body.data).to.be.an('object');
              expect(usersList).to.be.an('array');
              expect(usersList[0]).to.not.have.keys(['id', 'posts']);
              expect(usersList[0]).to.have.keys(['name', 'email']);
            })
            .catch(handleError);
        });

        it("should return a list of Users with Post's", () => {
          const body = {
            query: `query {
              users {
                name
                email
                posts {
                  title
                }
              }
            }`
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const usersList = response.body.data.users;

              expect(response.body.data).to.be.an('object');
              expect(usersList).to.be.an('array');
              expect(usersList[0]).to.not.have.key('id');
              expect(usersList[0]).to.have.keys(['name', 'email', 'posts']);
            })
            .catch(handleError);
        });

        it('should paginate a list of Users', () => {
          const body = {
            query: `query getUsersList($first: Int, $offset: Int) {
              users(first: $first, offset: $offset) {
                email
              }
            }`,
            variables: {
              first: 2,
              offset: 1
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const usersList = response.body.data.users;

              expect(response.body.data).to.be.an('object');
              expect(usersList)
                .to.be.an('array')
                .of.length(2);
              expect(usersList[0]).to.not.have.keys(['id', 'name', 'posts']);
              expect(usersList[0]).to.have.keys(['email']);
            })
            .catch(handleError);
        });
      });

      describe('user', () => {
        it('should return a single User', () => {
          const body = {
            query: `query getSingleUser($id: ID!) {
              user(id: $id) {
                id
                name
                email
              }
            }
            `,
            variables: {
              id: userID
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const singleUser = response.body.data.user;
              expect(response.body.data).to.be.an('object');
              expect(singleUser).to.be.an('object');
              expect(singleUser).to.have.keys(['id', 'name', 'email']);
              expect(singleUser.name).to.equal('Petter');
              expect(singleUser.email).to.equal('petter@guardians.com');
            })
            .catch(handleError);
        });

        it("should only 'name' attribute", () => {
          const body = {
            query: `query getSingleUser($id: ID!) {
              user(id: $id) {
                name
              }
            }
            `,
            variables: {
              id: userID
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const singleUserAttribute = response.body.data.user;
              expect(response.body.data).to.be.an('object');
              expect(singleUserAttribute).to.be.an('object');
              expect(singleUserAttribute).to.have.keys('name');
              expect(singleUserAttribute.name).to.equal('Petter');
              expect(singleUserAttribute.email).to.be.undefined;
            })
            .catch(handleError);
        });

        it('should return an error if User not exists', () => {
          const body = {
            query: `query getSingleUser($id: ID!) {
              user(id: $id) {
                name
              }
            }
            `,
            variables: {
              id: 0
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              expect(response.body.data.user).to.be.null;
              expect(response.body.errors).to.be.an('array');
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.errors[0].message).to.equal('Error: User with ID 0 not found!');
            })
            .catch(handleError);
        });
      });

      describe('currentUser', () => {
        it('should return the User owner of the token', () => {
          const body = {
            query: `query {
              currentUser {
                name
              }
            }`
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(response => {
              const currentUser = response.body.data.currentUser;

              expect(currentUser).to.be.an('object');
              expect(currentUser).to.have.key('name');
              expect(currentUser.name).to.equal('Petter');
            })
            .catch(handleError);
        });
      });
    });
  });

  describe('Mutations', () => {
    describe('application/json', () => {
      describe('createUser', () => {
        it('should create new User', () => {
          const body = {
            query: `mutation createNewUser($input: UserCreateInput!) {
              createUser(input: $input) {
                id
                name
                email
              }
            }`,
            variables: {
              input: {
                name: 'Rex',
                email: 'rex@rex.com',
                password: '12345'
              }
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const createdUser = response.body.data.createUser;

              expect(createdUser).to.be.an('object');
              expect(createdUser.name).to.equal('Rex');
              expect(createdUser.email).to.equal('rex@rex.com');
              expect(parseInt(createdUser.id)).to.be.a('number');
            })
            .catch(handleError);
        });
      });

      describe('updateUser', () => {
        it('should update an existing User', () => {
          const body = {
            query: `mutation updateExistingUser($input: UserUpdateInput!) {
              updateUser(input: $input) {
                name
                email
              }
            }`,
            variables: {
              input: {
                name: 'Lord',
                email: 'lord@zeus.io'
              }
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(response => {
              const updatedUser = response.body.data.updateUser;

              expect(updatedUser).to.be.an('object');
              expect(updatedUser.name).to.equal('Lord');
              expect(updatedUser.email).to.equal('lord@zeus.io');
              expect(updatedUser.id).to.be.undefined;
            })
            .catch(handleError);
        });

        it('should block operation if token is invalid', () => {
          const body = {
            query: `mutation createExistingUser($input: UserUpdateInput!) {
              updateUser(input: $input) {
                name
                email
              }
            }`,
            variables: {
              input: {
                name: 'Lord',
                email: 'lord@zeus.io'
              }
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', 'Bearer INVALID_TOKEN')
            .send(JSON.stringify(body))
            .then(response => {
              const invalidToken = response.body.data.updateUser;

              expect(invalidToken).to.be.null;
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.errors).to.have.an('array');
              expect(response.body.errors[0].message).to.equal('JsonWebTokenError: jwt malformed');
            })
            .catch(handleError);
        });
      });

      describe('updateUser', () => {
        it('should update the password of an existing User', () => {
          const body = {
            query: `mutation updatedPasswordExistingUser($input: UserUpdatePasswordInput!) {
              updateUserPassword(input: $input)
            }`,
            variables: {
              input: {
                password: 'lord123'
              }
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(response => {
              const updatedUserPassword = response.body.data.updateUserPassword;

              expect(updatedUserPassword).to.be.true;
            })
            .catch(handleError);
        });
      });

      describe('deleteUser', () => {
        it('should delete an existing User', () => {
          const body = {
            query: `mutation {
              deleteUser
            }`
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(response => {
              const deletedUser = response.body.data.deleteUser;

              expect(deletedUser).to.be.true;
            })
            .catch(handleError);
        });

        it('should block operation if token is not provided', () => {
          const body = {
            query: `mutation {
              deleteUser
            }`
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              expect(response.body.data.deleteUser).to.be.null;
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.errors).to.have.an('array');
              expect(response.body.errors[0].message).to.equal('Unauthorized! Token not provided!');
            })
            .catch(handleError);
        });
      });
    });
  });
});
