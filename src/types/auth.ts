export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}
