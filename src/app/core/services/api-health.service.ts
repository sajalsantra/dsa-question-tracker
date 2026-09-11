import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, timer, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiHealthService {
  private readonly http = inject(HttpClient);
  readonly isSpringBootOnline = signal<boolean>(false);
  private readonly apiUrl = 'http://localhost:8080/api/health';

  constructor() {
    this.startHealthCheck();
  }

  private startHealthCheck(): void {
    // Poll backend health status every 15 seconds
    timer(0, 15000).pipe(
      switchMap(() => this.http.get(this.apiUrl).pipe(
        catchError(() => of(null))
      ))
    ).subscribe(response => {
      this.isSpringBootOnline.set(response !== null);
    });
  }

  checkNow(): Promise<boolean> {
    return new Promise(resolve => {
      this.http.get(this.apiUrl).pipe(
        catchError(() => of(null))
      ).subscribe(res => {
        const isOnline = res !== null;
        this.isSpringBootOnline.set(isOnline);
        resolve(isOnline);
      });
    });
  }
}
