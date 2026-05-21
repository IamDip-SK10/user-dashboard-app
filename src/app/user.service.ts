import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _users = new BehaviorSubject<User[]>([
    {
      id: crypto.randomUUID(),
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      role: 'Admin',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: crypto.randomUUID(),
      name: 'Bob Martinez',
      email: 'bob.martinez@company.com',
      role: 'Editor',
      createdAt: new Date('2024-03-22'),
    },
    {
      id: crypto.randomUUID(),
      name: 'Carol Singh',
      email: 'carol.singh@company.com',
      role: 'Viewer',
      createdAt: new Date('2024-05-10'),
    },
    {
      id: crypto.randomUUID(),
      name: 'David Chen',
      email: 'david.chen@company.com',
      role: 'Editor',
      createdAt: new Date('2024-07-01'),
    },
  ]);

  readonly users$: Observable<User[]> = this._users.asObservable();

  getSnapshot(): User[] {
    return this._users.getValue();
  }

  addUser(payload: Omit<User, 'id' | 'createdAt'>): void {
    const newUser: User = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this._users.next([...this._users.getValue(), newUser]);
  }

  deleteUser(id: string): void {
    this._users.next(this._users.getValue().filter((u) => u.id !== id));
  }
}