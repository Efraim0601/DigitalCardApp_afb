import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Card, TemplateId } from '../models/card.model';

export type PagedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type Label = { id: string; labelFr: string; labelEn: string };

export type DataScope = 'cards' | 'departments' | 'job_titles';

export type ImportResult = {
  success: boolean;
  imported: { cards: number; departments: number; jobTitles: number };
  warnings: string[];
};

export type SmtpSettings = {
  enabled: boolean;
  host: string | null;
  port: number;
  username: string | null;
  hasPassword: boolean;
  protocol: string;
  auth: boolean;
  starttlsEnabled: boolean;
  sslEnabled: boolean;
  fromEmail: string | null;
  fromName: string | null;
  updatedAt: string | null;
};

export type SmtpSettingsUpdatePayload = {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password?: string;
  clearPassword?: boolean;
  protocol: string;
  auth: boolean;
  starttlsEnabled: boolean;
  sslEnabled: boolean;
  fromEmail: string;
  fromName: string;
};

export type AppearanceSettings = {
  allowUserTemplate: boolean;
  defaultTemplate: TemplateId;
  updatedAt: string | null;
};

export type AppearanceSettingsUpdatePayload = {
  allowUserTemplate: boolean;
  defaultTemplate: TemplateId;
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly http: HttpClient) {}

  export(scope: DataScope, format: 'csv' | 'xlsx' = 'xlsx'): Observable<Blob> {
    const params = new HttpParams().set('scope', scope).set('format', format);
    return this.http.get('/api/admin/data-export', { params, responseType: 'blob' });
  }

  downloadTemplate(scope: DataScope): Observable<Blob> {
    const params = new HttpParams().set('scope', scope);
    return this.http.get('/api/admin/data-template', { params, responseType: 'blob' });
  }

  import(scope: DataScope, file: File, onConflict: 'overwrite' | 'ignore' = 'overwrite'): Observable<ImportResult> {
    const params = new HttpParams().set('scope', scope).set('onConflict', onConflict);
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportResult>('/api/admin/data-import', form, { params });
  }

  listCards(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Card>> {
    let httpParams = new HttpParams().set('limit', params.limit).set('offset', params.offset);
    if (params.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<PagedResult<Card>>('/api/cards', { params: httpParams });
  }

  createOrUpsertCard(payload: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    mobile?: string | null;
    departmentId?: string | null;
    jobTitleId?: string | null;
  }): Observable<Card> {
    return this.http.post<Card>('/api/cards', payload);
  }

  updateCard(id: string, payload: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    mobile?: string | null;
    departmentId?: string | null;
    jobTitleId?: string | null;
  }): Observable<Card> {
    return this.http.put<Card>(`/api/cards/${id}`, payload);
  }

  deleteCard(id: string): Observable<void> {
    return this.http.delete<void>(`/api/cards/${id}`);
  }

  bulkDeleteCards(ids: string[]): Observable<{ success: boolean; deleted: number }> {
    return this.http.post<{ success: boolean; deleted: number }>('/api/cards/bulk-delete', { ids });
  }

  listDepartments(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>> {
    let httpParams = new HttpParams().set('limit', params.limit).set('offset', params.offset);
    if (params.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<PagedResult<Label>>('/api/departments', { params: httpParams });
  }

  createDepartment(dep: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.http.post<Label>('/api/departments', dep);
  }

  updateDepartment(id: string, dep: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.http.put<Label>(`/api/departments/${id}`, dep);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`/api/departments/${id}`);
  }

  listJobTitles(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>> {
    let httpParams = new HttpParams().set('limit', params.limit).set('offset', params.offset);
    if (params.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<PagedResult<Label>>('/api/job-titles', { params: httpParams });
  }

  createJobTitle(title: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.http.post<Label>('/api/job-titles', title);
  }

  updateJobTitle(id: string, title: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.http.put<Label>(`/api/job-titles/${id}`, title);
  }

  deleteJobTitle(id: string): Observable<void> {
    return this.http.delete<void>(`/api/job-titles/${id}`);
  }

  getSmtpSettings(): Observable<SmtpSettings> {
    return this.http.get<SmtpSettings>('/api/admin/smtp-settings');
  }

  updateSmtpSettings(payload: SmtpSettingsUpdatePayload): Observable<SmtpSettings> {
    return this.http.put<SmtpSettings>('/api/admin/smtp-settings', payload);
  }

  sendSmtpTestEmail(toEmail: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/api/admin/smtp-settings/test', { toEmail });
  }

  getAppearanceSettings(): Observable<AppearanceSettings> {
    return this.http.get<AppearanceSettings>('/api/admin/appearance-settings');
  }

  updateAppearanceSettings(payload: AppearanceSettingsUpdatePayload): Observable<AppearanceSettings> {
    return this.http.put<AppearanceSettings>('/api/admin/appearance-settings', payload);
  }
}

