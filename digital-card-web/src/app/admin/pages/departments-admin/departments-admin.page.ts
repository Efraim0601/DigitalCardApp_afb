import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminService, Label, PagedResult } from '../../../shared/services/admin.service';
import { BaseLabelAdminPage, LabelAdminStrings } from '../label-admin/label-admin.page';

@Component({
  selector: 'app-departments-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: '../label-admin/label-admin.page.html'
})
export class DepartmentsAdminPageComponent extends BaseLabelAdminPage {
  readonly addButtonLabel = 'Ajouter une direction';
  readonly formTitle = 'Ajouter une direction';
  readonly emptyLabel = 'Aucune direction enregistrée.';

  constructor(private readonly admin: AdminService) {
    super();
    this.load();
  }

  protected list(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>> {
    return this.admin.listDepartments(params);
  }

  protected create(payload: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.admin.createDepartment(payload);
  }

  protected remove(id: string): Observable<void> {
    return this.admin.deleteDepartment(id);
  }

  protected strings(): LabelAdminStrings {
    return {
      loadError: 'Impossible de charger les directions.',
      saveError: "Impossible d'enregistrer.",
      deleteError: 'Impossible de supprimer.',
      deleteConfirm: 'Supprimer cette direction ?'
    };
  }
}
