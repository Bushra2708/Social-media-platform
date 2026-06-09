import api from "./api";

export const getConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data;
};

export const getMessages = async (userId) => {
  const response = await api.get(`/messages/${userId}`);
  return response.data;
};

export const sendMessage = async (receiverId, text, imageFile = null) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append("receiverId", receiverId);
    formData.append("text", text || "");
    formData.append("image", imageFile);
    
    const response = await api.post("/messages", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } else {
    const response = await api.post("/messages", {
      receiverId,
      text,
    });
    return response.data;
  }
};
