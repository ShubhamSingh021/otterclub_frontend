import API from "./client";

export const createRegistration = async (registrationData) => {
  const { data } = await API.post("/registrations", registrationData);
  return data;
};

export const getRegistrations = async (params = {}) => {
  const { data } = await API.get("/registrations/admin", { params });
  return data;
};

export const updateRegistrationStatus = async (id, updateData) => {
  const { data } = await API.patch(`/registrations/admin/${id}`, updateData);
  return data;
};

export const deleteRegistration = async (id) => {
  const { data } = await API.delete(`/registrations/admin/${id}`);
  return data;
};

export const getMyRegistrations = async () => {
  const { data } = await API.get("/registrations/my");
  return data;
};
