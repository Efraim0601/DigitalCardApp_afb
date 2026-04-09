import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-card-demo-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">Business card (placeholder)</h2>
      <p class="mt-2 text-sm text-slate-600">
        Email: <span class="font-mono">{{ email || '—' }}</span>
      </p>
      <p class="mt-1 text-sm text-slate-600">
        Prochaine étape: intégrer le composant shared <code class="font-mono">business-card</code> + QR code.
      </p>
    </div>
  `
})
export class CardDemoPageComponent {
  email = this.route.snapshot.queryParamMap.get('email');

  constructor(private readonly route: ActivatedRoute) {}
}

