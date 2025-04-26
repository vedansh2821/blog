/**
 * Represents a comment object.
 */
export interface Comment {
  /**
   * The ID of the comment.
   */
  id: string;
  /**
   * The ID of the blog post the comment belongs to.
   */
  postId: string;
  /**
   * The author of the comment.
   */
  author: string;
  /**
   * The content of the comment.
   */
  content: string;
  /**
   * The timestamp of the comment.
   */
  timestamp: number;
  /**
   * The list of replies to the comment.
   */
  replies: Comment[];
}

/**
 * Asynchronously retrieves comments for a given blog post ID.
 *
 * @param postId The ID of the blog post.
 * @returns A promise that resolves to an array of Comment objects containing the comments for the blog post.
 */
export async function getComments(postId: string): Promise<Comment[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      id: '1',
      postId: postId,
      author: 'John Doe',
      content: 'This is a great blog post!',
      timestamp: Date.now(),
      replies: [],
    },
  ];
}
