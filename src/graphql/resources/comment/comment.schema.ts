const commentTypes = `
  type Comment {
    id: ID!
    comment: String!
    user: User!
    post: Post!
  }

  input CommentCreateInput {
    comment: String!
    post: Int!
  }
`;

const commentQueries = `
  commentsByPost(postId: ID!, first: Int, offset: Int): [Comment!]!
`;

const commentMutations = `
  createComment(input: CommentCreateInput!): Comment
  updateComment(id: ID!, input: CommentCreateInput!): Comment
  deleteComment(id: ID!): Boolean
`;

export { commentTypes, commentQueries, commentMutations };
