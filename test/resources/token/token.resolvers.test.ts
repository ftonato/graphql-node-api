import { app, chai, db, expect, handleError } from './../../test-utils';

describe('Token', () => {
  beforeEach(() => {
    return db.Comment.destroy({ where: {} })
      .then((rows: number) => db.Post.destroy({ where: {} }))
      .then((rows: number) => db.User.destroy({ where: {} }))
      .then((rows: number) =>
        db.User.create({
          name: 'Peter Quill',
          email: 'peter@guardians.com',
          password: '1234'
        })
      )
      .catch(handleError);
  });

  describe('Mutations', () => {
    describe('application/json', () => {
      describe('createToken', () => {
        it('should create a new Token', () => {
          let body = {
            query: `mutation createNewToken($email: String!, $password: String!) {
              createToken(email: $email, password: $password) {
                token
              }
            }
            `,
            variables: {
              email: 'peter@guardians.com',
              password: '1234'
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              expect(response.body.data).to.have.key('createToken');
              expect(response.body.data.createToken).to.have.key('token');
              expect(response.body.data.createToken.token).to.be.string;
              expect(response.body.errors).to.be.undefined;
            })
            .catch(handleError);
        });

        it('should return an error if the password is incorrect', () => {
          let body = {
            query: `mutation createNewToken($email: String!, $password: String!) {
              createToken(email: $email, password: $password) {
                token
              }
            }
            `,
            variables: {
              email: 'peter@guardians.com',
              password: 'WRONG_PASSWORD'
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.data).to.have.key('createToken');
              expect(response.body.data.createToken).to.be.null;
              expect(response.body.errors)
                .to.be.an('array')
                .with.length(1);
              expect(response.body.errors[0].message).to.equal('Unauthorized, wrong email or password!');
            })
            .catch(handleError);
        });

        it('should return an error when the email not exists', () => {
          let body = {
            query: `mutation createNewToken($email: String!, $password: String!) {
                createToken(email: $email, password: $password) {
                  token
                }
              }
              `,
            variables: {
              email: 'ronan@guardians.com',
              password: '1234'
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.data).to.have.key('createToken');
              expect(response.body.data.createToken).to.be.null;
              expect(response.body.errors)
                .to.be.an('array')
                .with.length(1);
              expect(response.body.errors[0].message).to.equal('Unauthorized, wrong email or password!');
            })
            .catch(handleError);
        });
      });
    });
  });
});
