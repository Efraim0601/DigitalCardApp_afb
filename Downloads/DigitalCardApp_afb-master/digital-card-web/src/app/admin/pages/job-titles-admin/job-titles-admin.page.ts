import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AdminService, DataScope, Label, PagedResult } from '../../../shared/services/admin.service';
import { BaseLabelAdminPage, LabelAdminKeys } from '../label-admin/label-admin.page';

@Component({
  selector: 'app-job-titles-admin-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: '../label-admin/label-admin.page.html'
})
export class JobTitlesAdminPageComponent extends BaseLabelAdminPage {
  readonly addButtonKey = 'admin.jobTitles.addBtn';
  readonly emptyKey = 'admin.jobTitles.empty';
  readonly exportScope: DataScope = 'job_titles';

  constructor(readonly adminService: AdminService) {
    super();
    this.load();
  }

  protected list(params: { q?: string; limit: number; offset: number }): Observable<PagedResult<Label>> {
    return this.adminService.listJobTitles(params);
  }

  protected create(payload: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.adminService.createJobTitle(payload);
  }

  protected updateItem(id: string, payload: { labelFr: string; labelEn: string }): Observable<Label> {
    return this.adminService.updateJobTitle(id, payload);
  }

  protected remove(id: string): Observable<void> {
    return this.adminService.deleteJobTitle(id);
  }

  protected keys(): LabelAdminKeys {
    return {
      loadErrorKey: 'admin.jobTitles.loadError',
      saveErrorKey: 'admin.jobTitles.saveError',
      deleteErrorKey: 'admin.jobTitles.deleteError',
      deleteConfirmKey: 'admin.jobTitles.deleteConfirm',
      createTitleKey: 'admin.jobTitles.formTitle',
      editTitleKey: 'admin.jobTitles.editTitle'
    };
  }
}
