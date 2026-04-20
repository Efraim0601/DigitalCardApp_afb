import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslateModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Digital Card';
}
