import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Card } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class CardsService {
  constructor(private readonly http: HttpClient) {}

  getByEmail(email: string): Observable<Card> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Card>('/api/cards', { params });
  }
}

