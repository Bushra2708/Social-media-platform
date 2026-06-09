import api from "./api";

export const getPosts = async (page = 1, limit = 10) => {
  const response = await api.get(`/posts?page=${page}&limit=${limit}`);
  return response.data;
};

export const getFeedPosts = async (page = 1, limit = 10) => {
  const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
  return response.data;
};

export const createPost = async (content, imageFile) => {
  const formData = new FormData();
  formData.append("content", content);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await api.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

export const likePost = async (postId) => {
  const response = await api.put(`/posts/${postId}/like`);
  return response.data;
};

export const bookmarkPost = async (postId) => {
  const response = await api.put(`/posts/${postId}/bookmark`);
  return response.data;
};

export const addComment = async (postId, text) => {
  const response = await api.post(`/posts/${postId}/comment`, { text });
  return response.data;
};

export const deleteComment = async (postId, commentId) => {
  const response = await api.delete(`/posts/${postId}/comment/${commentId}`);
  return response.data;
};

export const repostPost = async (postId, content = "") => {
  const response = await api.post("/posts", { repostOf: postId, content });
  return response.data;
};