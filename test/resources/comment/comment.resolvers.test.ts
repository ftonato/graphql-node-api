import * as jwt from 'jsonwebtoken';
import { CommentInstance } from '../../../src/interfaces/Comment.interface';
import { PostInstance } from '../../../src/interfaces/Post.interface';
import { UserInstance } from '../../../src/interfaces/User.interface';
import { JWT_SECRET } from '../../../src/utils/utils';
import { app, chai, db, expect, handleError } from './../../test-utils';

describe('Comment', () => {
  let token: string;
  let userID: number;
  let postID: number;
  let commentID: number;

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
      .then((user: UserInstance) => {
        userID = user.get('id');
        const payload = { sub: userID };
        token = jwt.sign(payload, JWT_SECRET);

        return db.Post.create({
          title: 'First post',
          content: 'First post',
          author: userID
        });
      })
      .then((post: PostInstance) => {
        postID = post.get('id');

        return db.Comment.bulkCreate([
          {
            comment: 'First comment',
            user: userID,
            post: postID
          },
          {
            comment: 'Second comment',
            user: userID,
            post: postID
          },
          {
            comment: 'Third comment',
            user: userID,
            post: postID
          }
        ]);
      })
      .then((comments: CommentInstance[]) => {
        commentID = comments[0].get('id');
      });
  });

  describe('Queries', () => {
    describe('application/json', () => {
      describe('commentsByPost', () => {
        it('should return a list of Comments', () => {
          let body = {
            query: `query getCommentsByPostList($postId: ID!, $first: Int, $offset: Int) {
              commentsByPost(postId: $postId, first: $first, offset: $offset) {
                comment
                user {
                  id
                }
                post {
                  id
                }
              }
            }
            `,
            variables: {
              postId: postID
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .send(JSON.stringify(body))
            .then(response => {
              const commentsList = response.body.data.commentsByPost;

              expect(response.body.data).to.be.an('object');
              expect(commentsList).to.be.an('array');
              expect(commentsList[0]).to.not.have.keys(['id', 'createdAt', 'updatedAt']);
              expect(commentsList[0]).to.have.keys(['comment', 'user', 'post']);
              expect(parseInt(commentsList[0].user.id)).to.equal(userID);
              expect(parseInt(commentsList[0].post.id)).to.equal(postID);
            })
            .catch(handleError);
        });
      });
    });
  });

  describe('Mutations', () => {
    describe('application/json', () => {
      describe('createComment', () => {
        it('should create a new Comment', () => {
          let body = {
            query: `mutation createNewComment($input: CommentCreateInput!) {
              createComment(input: $input) {
                comment
                user {
                  id
                  name
                }
                post {
                  id
                  title
                }
              }
            }
            `,
            variables: {
              input: {
                comment: 'First comment',
                post: postID
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
              const createdComment = response.body.data.createComment;

              expect(response.body.data).to.be.an('object');
              expect(response.body.data).to.have.key('createComment');
              expect(createdComment).to.be.an('object');
              expect(createdComment).to.have.keys(['comment', 'user', 'post']);
              expect(parseInt(createdComment.user.id)).to.equal(userID);
              expect(createdComment.user.name).to.equal('Peter Quill');
              expect(parseInt(createdComment.post.id)).to.equal(postID);
              expect(createdComment.post.title).to.equal('First post');
            })
            .catch(handleError);
        });
      });

      describe('updateComment', () => {
        it('should update an existing Comment', () => {
          let body = {
            query: `mutation updateExistingComment($id: ID!, $input: CommentCreateInput!) {
              updateComment(id: $id, input: $input) {
                id
                comment
              }
            }
            `,
            variables: {
              id: commentID,
              input: {
                comment: 'Comment changed',
                post: postID
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
              const updatedComment = response.body.data.updateComment;

              expect(response.body.data).to.be.an('object');
              expect(response.body.data).to.have.key('updateComment');
              expect(updatedComment).to.be.an('object');
              expect(updatedComment).to.have.keys(['id', 'comment']);
              expect(updatedComment.comment).to.equal('Comment changed');
            })
            .catch(handleError);
        });
      });

      describe('deleteComment', () => {
        it('should delete an existing Comment', () => {
          let body = {
            query: `mutation deleteExistingComment($id: ID!) {
              deleteComment(id: $id)
            }
            `,
            variables: {
              id: commentID
            }
          };

          return chai
            .request(app)
            .post('/graphql')
            .set('content-type', 'application/json')
            .set('authorization', `Bearer ${token}`)
            .send(JSON.stringify(body))
            .then(response => {
              const deletedComment = response.body.data.deleteComment;

              expect(response.body.data).to.be.an('object');
              expect(response.body.data).to.have.key('deleteComment');
              expect(deletedComment).to.be.true;
            })
            .catch(handleError);
        });
      });
    });
  });
});
