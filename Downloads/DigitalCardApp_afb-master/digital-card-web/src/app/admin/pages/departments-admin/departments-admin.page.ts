import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AdminService, DataScope, Label, PagedResult } from '../../../shared/services/admin.service';
import { BaseLabelAdminPage, LabelAdminKeys } from '../label-admin/label-admin.page';

@Component({
  selector: 'app-departments-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: '../label-admin/label-admin.page.html'
})
export class DepartmentsAdminPageComponent extends BaseLabelAdminPage {
  readonly addButtonKey = 'admin.departments.addBtn';
  readonly emptyKey = 'admin.departments.empty';
  readonly exportScope: DataScope = 'departments';

  constructor(readonly adminService: AdminService) {
    super();
    this.load();
  }

  protected list(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>> {
    return this.adminService.listDepartments(params);
  }

  protected create(payload: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.adminService.createDepartment(payload);
  }

  protected updateItem(id: string, payload: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.adminService.updateDepartment(id, payload);
  }

  protected remove(id: string): Observable<void> {
    return this.adminService.deleteDepartment(id);
  }

  protected keys(): LabelAdminKeys {
    return {
      loadErrorKey: 'admin.departments.loadError',
      saveErrorKey: 'admin.departments.saveError',
      deleteErrorKey: 'admin.departments.deleteError',
      deleteConfirmKey: 'admin.departments.deleteConfirm',
      createTitleKey: 'admin.departments.formTitle',
      editTitleKey: 'admin.departments.editTitle'
    };
  }
}
