import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminService, Label, PagedResult } from '../../../shared/services/admin.service';
import { BaseLabelAdminPage, LabelAdminStrings } from '../label-admin/label-admin.page';

@Component({
  selector: 'app-job-titles-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../label-admin/label-admin.page.html'
})
export class JobTitlesAdminPageComponent extends BaseLabelAdminPage {
  readonly addButtonLabel = 'Ajouter un titre';
  readonly formTitle = 'Ajouter un titre / poste';
  readonly emptyLabel = 'Aucun titre / poste enregistré.';

  constructor(private readonly admin: AdminService) {
    super();
    this.load();
  }

  protected list(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>> {
    return this.admin.listJobTitles(params);
  }

  protected create(payload: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.admin.createJobTitle(payload);
  }

  protected remove(id: string): Observable<void> {
    return this.admin.deleteJobTitle(id);
  }

  protected strings(): LabelAdminStrings {
    return {
      loadError: 'Impossible de charger les titres.',
      saveError: "Impossible d'enregistrer.",
      deleteError: 'Impossible de supprimer.',
      deleteConfirm: 'Supprimer ce titre ?'
    };
  }
}
