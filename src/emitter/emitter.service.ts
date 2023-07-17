import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class EmitterService<T> implements OnModuleDestroy {
  private subjects = new Map<string, Subject<any>>();

  emit(event: keyof T, data: T[keyof T]) {
    const key = event as string;

    if (this.subjects.has(key)) {
      this.subjects.get(key).next(data);
    }
  }

  on(event: keyof T, callback: (val: T[keyof T]) => void) {
    this.observe(event).subscribe(callback);
  }

  observe(event: keyof T): Subject<T[keyof T]> {
    const key = event as string;

    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject());
    }

    return this.subjects.get(key);
  }

  onModuleDestroy() {
    for (const [, subject] of this.subjects) {
      subject.unsubscribe();
    }

    this.subjects.clear();
  }
}
