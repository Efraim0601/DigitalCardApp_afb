import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { withCredentialsInterceptor } from './shared/interceptors/with-credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([withCredentialsInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })
    ),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'fr',
        loader: {
          provide: TranslateLoader,
          useClass: TranslateHttpLoader
        }
      })
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const translate = inject(TranslateService);
        return () => firstValueFrom(translate.use('fr'));
      }
    },
    ...provideTranslateHttpLoader({
      prefix: 'assets/i18n/',
      suffix: '.json'
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
