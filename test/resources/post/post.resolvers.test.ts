import * as jwt from 'jsonwebtoken';
import { beforeEach, it } from 'mocha';
import { PostInstance } from '../../../src/interfaces/Post.interface';
import { UserInstance } from '../../../src/interfaces/User.interface';
import { JWT_SECRET } from '../../../src/utils/utils';
import { app, chai, db, expect, handleError } from '../../test-utils';

describe('Post', () => {
  let userID: number;
  let token: string;
  let postID: number;

  beforeEach(() => {
    return db.Comment.destroy({ where: {} })
      .then((rows: number) => db.Post.destroy({ where: {} }))
      .then((rows: number) => db.User.destroy({ where: {} }))
      .then((rows: number) =>
        db.User.create({
          name: 'Lilith',
          email: 'lilith@guardians.com',
          password: '123456'
        })
      )
      .then((user: UserInstance) => {
        userID = user.get('id');

        const payload = { sub: userID };
        token = jwt.sign(payload, JWT_SECRET);

        return db.Post.bulkCreate([
          {
            title: 'First post',
            content: 'first post',
            author: userID
          },
          {
            title: 'Second post',
            content: 'second post',
            author: userID
          },
          {
            title: 'Third post',
            content: 'third post',
            author: userID
          }
        ]);
      })
      .then((posts: PostInstance[]) => {
        postID = posts[0].get('id');
      });
  });

  describe('Queries', () => {
    describe('application/json', () => {
      describe('posts', () => {
        it('should return a list of Posts', () => {
          const body = {
            query: `query {
              posts {
                title
                content
              }
            }`
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const postsList = response.body.data.posts;

              expect(response.body.data).to.be.an('object');
              expect(postsList).to.be.an('array');
              expect(postsList[0]).to.not.have.keys(['id', 'author', 'comments']);
              expect(postsList[0]).to.have.keys(['title', 'content']);
              expect(postsList[0].title).to.equal('First post');
            })
            .catch(handleError);
        });

        it('should paginate a list of Posts', () => {
          const body = {
            query: `query getPostsList($first: Int, $offset: Int) {
              posts(first: $first, offset: $offset) {
                title
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
              const postsList = response.body.data.posts;

              expect(response.body.data).to.be.an('object');
              expect(postsList)
                .to.be.an('array')
                .of.length(2);
              expect(postsList[0]).to.not.have.keys(['id', 'content', 'comments']);
              expect(postsList[0]).to.have.key('title');
              expect(postsList[0].title).to.equal('Second post');
            })
            .catch(handleError);
        });
      });

      describe('post', () => {
        it('should return a single Post with author (User)', () => {
          const body = {
            query: `query getPost($id: ID!) {
              post(id: $id) {
                content
                author {
                  name
                }
              }
            }
            `,
            variables: {
              id: postID
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const singlePost = response.body.data.post;
              expect(response.body.data).to.be.an('object');
              expect(singlePost).to.be.an('object');
              expect(singlePost).to.have.keys(['content', 'author']);
              expect(singlePost.author).to.be.an('object');
              expect(singlePost.author.name).to.equal('Lilith');
              expect(singlePost.content).to.equal('first post');
              expect(singlePost.title).to.be.undefined;
            })
            .catch(handleError);
        });

        it('should return an error if Post not exists', () => {
          const body = {
            query: `query getSinglePost($id: ID!) {
              post(id: $id) {
                title
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
              expect(response.body.data.post).to.be.null;
              expect(response.body.errors).to.be.an('array');
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.errors[0].message).to.equal('Error: Post with ID 0 not found!');
            })
            .catch(handleError);
        });
      });
    });
  });

  describe('Mutations', () => {
    describe('application/json', () => {
      describe('createPost', () => {
        it('should create new Post', () => {
          const body = {
            query: `mutation createNewPost($input: PostCreateInput!) {
              createPost(input: $input) {
                title
                content
                author {
                  name
                }
              }
            }`,
            variables: {
              input: {
                title: 'Last post',
                content: 'last post inserted'
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
              const createdPost = response.body.data.createPost;

              expect(createdPost).to.be.an('object');
              expect(createdPost.title).to.equal('Last post');
              expect(createdPost.content).to.equal('last post inserted');
              expect(parseInt(createdPost.id)).to.be.a('number');
              expect(createdPost.author).to.be.an('object');
              expect(createdPost.author).to.have.key('name');
              expect(createdPost.author.name).to.equal('Lilith');
            })
            .catch(handleError);
        });
      });

      describe('updatePost', () => {
        it('should update an existing Post', () => {
          const body = {
            query: `mutation updateExistingPost($id: ID!, $input: PostCreateInput!) {
              updatePost(id: $id, input: $input) {
                title
                content
              }
            }`,
            variables: {
              id: postID,
              input: {
                title: 'Lord post',
                content: 'lord post'
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
              const updatedPost = response.body.data.updatePost;

              expect(updatedPost).to.be.an('object');
              expect(updatedPost.title).to.equal('Lord post');
              expect(updatedPost.content).to.equal('lord post');
              expect(updatedPost.id).to.be.undefined;
            })
            .catch(handleError);
        });

        it('should block operation if token is invalid', () => {
          const body = {
            query: `mutation updateExistingPost($id: ID!, $input: PostCreateInput!) {
              updatePost(id: $id, input: $input) {
                title
                content
              }
            }`,
            variables: {
              id: postID,
              input: {
                title: 'Lord post',
                content: 'lord post'
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
              const invalidToken = response.body.data.updatePost;

              expect(invalidToken).to.be.null;
              expect(response.body).to.have.keys(['data', 'errors']);
              expect(response.body.errors).to.have.an('array');
              expect(response.body.errors[0].message).to.equal('JsonWebTokenError: jwt malformed');
            })
            .catch(handleError);
        });
      });

      describe('deletePost', () => {
        it('should delete an existing Post', () => {
          const body = {
            query: `mutation deletedPost($id: ID!) {
              deletePost(id: $id)
            }`,
            variables: {
              id: postID
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(response => {
              const deletedPost = response.body.data.deletePost;

              expect(deletedPost).to.be.true;
            })
            .catch(handleError);
        });
      });
    });
  });
});
