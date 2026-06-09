import api from "./api";

export const getStories = async () => {
  const response = await api.get("/stories");
  return response.data;
};

export const createStory = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await api.post("/stories", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
