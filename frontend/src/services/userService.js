import api from "./api";

export const getUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const followUser = async (userId) => {
  const response = await api.put(`/users/${userId}/follow`);
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const getRecommendedUsers = async () => {
  const response = await api.get("/users/recommended");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const formData = new FormData();
  if (profileData.name) formData.append("name", profileData.name);
  if (profileData.bio !== undefined) formData.append("bio", profileData.bio);
  if (profileData.avatar) formData.append("avatar", profileData.avatar);
  if (profileData.coverImage) formData.append("coverImage", profileData.coverImage);

  const response = await api.put("/users/update", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
