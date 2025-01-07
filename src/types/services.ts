import { AxiosInstance } from 'axios';

interface User {
  id?: number;
  name: string;
}

export class Services {
  constructor(private readonly axios: AxiosInstance) {}

  async getUsers(): Promise<User[]> {
    const { data } = await this.axios.get<User[]>('/users');
    return data;
  }

  async createUser(user: User): Promise<User> {
    const { data } = await this.axios.post<User>('/users', user);
    return data;
  }

  async updateUser(id: number, user: User): Promise<User> {
    const { data } = await this.axios.put<User>(`/users/${id}`, user);
    return data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.axios.delete(`/users/${id}`);
  }
} 