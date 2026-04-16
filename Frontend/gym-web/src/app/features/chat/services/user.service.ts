import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { User } from '../models/user.model';


@Injectable({ providedIn: 'root' })
export class UserService {

  constructor(private api: ApiService) {}

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('/api/users');
  }
}
