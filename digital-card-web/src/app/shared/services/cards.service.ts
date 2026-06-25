import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Card, TemplateId } from '../models/card.model';

export type PublicAppearanceSettings = {
  allowUserTemplate: boolean;
  defaultTemplate: TemplateId;
  updatedAt?: string | null;
};

export type PublicLabel = { id: string; labelFr: string; labelEn: string; groupName?: string | null };

type PagedLabels = { items: PublicLabel[]; total: number; limit: number; offset: number };

export type PublicCardCreatePayload = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  mobile?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
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

  createPublicCard(payload: PublicCardCreatePayload): Observable<Card> {
    return this.http.post<Card>('/api/cards/public', payload);
  }

  listDepartments(): Observable<PublicLabel[]> {
    const params = new HttpParams().set('limit', 1000).set('offset', 0);
    return this.http
      .get<PagedLabels>('/api/departments', { params })
      .pipe(map((res) => res.items ?? []));
  }

  listJobTitles(): Observable<PublicLabel[]> {
    const params = new HttpParams().set('limit', 1000).set('offset', 0);
    return this.http
      .get<PagedLabels>('/api/job-titles', { params })
      .pipe(map((res) => res.items ?? []));
  }
}