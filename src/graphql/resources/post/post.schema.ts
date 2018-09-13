const postTypes = `
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: (first: Int, offset: Int): [Comment!]!
  }

  input PostCreateInput {
    title: String!
    content: String!
    author: Int!
  }
`;

const postQueries = `
  posts(first: Int, offset: Int): [Post!]!
  post(id: ID!): Post
`;

const postMutations = `
  createPost(input: PostCreateInput!): Post
  updatePost(id: ID!, input: PostCreateInput!): Post
  deletePost(id: ID!): Boolean
`;

export { postTypes, postQueries, postMutations };
