import { beforeEach, it } from 'mocha';
import { UserInstance } from '../../../src/interfaces/User.interface';
import { app, chai, db, expect, handleError } from './../../test-utils';

describe('User', () => {
  let userID: number;

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
    });
  });
});
