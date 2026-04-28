import { userApi } from "./api";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  register: async (data: RegisterPayload) => {
    const res = await userApi.post("/register", data);
    return res.data;
  },

  login: async (data: LoginPayload) => {
    const res = await userApi.post("/login", data);
    return res.data as {
      access_token: string;
      user: { id: string; email: string; username: string };
    };
  },
};
