import { HttpInterceptorFn } from '@angular/common/http';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.withCredentials) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};

