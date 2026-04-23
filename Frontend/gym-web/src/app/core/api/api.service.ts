import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type ApiQueryValue = string | number | boolean;

@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(url: string, options?: { params?: Record<string, ApiQueryValue | null | undefined> }): Observable<T> {
    let params = new HttpParams();

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== null && value !== undefined) {
          params = params.set(key, String(value));
        }
      }
    }

    return this.http.get<T>(`${this.base}${url}`, { params });
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${url}`, body);
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${url}`, body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${url}`);
  }

  postForm<T>(url: string, body: FormData): Observable<T> {
    return this.http.post<T>(`${this.base}${url}`, body);
  }
  patch<T>(url: string, body: unknown): Observable<T> {
  return this.http.patch<T>(`${this.base}${url}`, body);
}
}
