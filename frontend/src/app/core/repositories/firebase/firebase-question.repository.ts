import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { collection, getDocs } from 'firebase/firestore';
import { Question } from '../../models/question.model';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseQuestionRepository {
  private readonly fb = inject(FirebaseService);

  getAll(): Observable<Question[]> {
    const questionsCol = collection(this.fb.db, 'questions');
    return from(getDocs(questionsCol)).pipe(
      map(snapshot => {
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => doc.data() as Question);
        }
        return [];
      }),
      catchError(err => {
        console.warn('Firestore Question fetch failed:', err);
        return of([]);
      })
    );
  }
}
