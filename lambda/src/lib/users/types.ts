
export interface User {
  firstName: string;
  surname: string;
  username: string;
}

export interface CreateUser extends User {
  password: string;
}
