import { Observable } from 'rxjs';
import { AppSettings } from '../models/settings.model';

export abstract class SettingsRepository {
  abstract get(): Observable<AppSettings>;
  abstract save(settings: AppSettings): Observable<void>;
  syncLocalToRemote?(): Observable<void>;
}
