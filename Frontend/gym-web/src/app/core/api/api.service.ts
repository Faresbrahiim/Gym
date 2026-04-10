import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.base}${url}`);
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

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}${url}`, body);
  }

  postForm<T>(url: string, body: FormData): Observable<T> {
    return this.http.post<T>(`${this.base}${url}`, body);
  }
}
