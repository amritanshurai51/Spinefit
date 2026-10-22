import { BASE_URL } from '../config';
import { auth } from './firebase';

export class ApiError extends Error {
  code: string;
  status: number;
  detail: string;
  errors?: { field: string; message: string }[];

  constructor(status: number, body: any) {
    super(body?.detail ?? 'Something went wrong');
    this.status = status;
    this.code = body?.code ?? 'unknown';
    this.detail = body?.detail ?? 'Something went wrong';
    this.errors = body?.errors;
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function api<T = any>(method: string, path: string, body?: any): Promise<T> {
  const send = async (forceRefresh: boolean) => {
    const user = auth.currentUser;
    if (!user) throw new ApiError(401, { code: 'missing_token', detail: 'Please sign in again.' });
    const token = await user.getIdToken(forceRefresh);
    return fetch(BASE_URL + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  for (let attempt = 0; ; attempt++) {
    try {
      let response = await send(false);
      let data: any = await response.json().catch(() => ({}));
      if (response.status === 401 && data.code === 'token_expired') {
        response = await send(true);
        data = await response.json().catch(() => ({}));
      }
      if (response.ok) return data as T;
      if ((response.status === 502 || response.status === 503) && attempt < 2) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw new ApiError(response.status, data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (attempt < 2) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw new ApiError(0, { code: 'network', detail: 'No internet connection. Please try again.' });
    }
  }
}
