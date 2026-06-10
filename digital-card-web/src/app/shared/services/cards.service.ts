import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Card, TemplateId } from '../models/card.model';

export type PublicAppearanceSettings = {
  allowUserTemplate: boolean;
  defaultTemplate: TemplateId;
  updatedAt?: string | null;
};

@Injectable({ providedIn: 'root' })
export class CardsService {
  constructor(private readonly http: HttpClient) {}

  getByEmail(email: string): Observable<Card> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Card>('/api/cards', { params });
  }

  incrementShareCount(email: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`/api/cards/increment-share/${encodeURIComponent(email)}`, {});
  }

  getAppearanceSettings(): Observable<PublicAppearanceSettings> {
    return this.http.get<PublicAppearanceSettings>('/api/appearance-settings');
  }

  updateTemplate(email: string, templateId: TemplateId): Observable<Card> {
    return this.http.put<Card>('/api/cards/template', { email, templateId });
  }
}
