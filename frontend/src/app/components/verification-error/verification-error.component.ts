import { Component, OnInit, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-verification-error',
  templateUrl: './verification-error.component.html',
  styleUrls: ['./verification-error.component.scss'],
})
export class VerificationErrorComponent implements OnInit {
  @Input()
  error: HttpErrorResponse;

  get status() {
    return this.error.status;
  }

  get hash(): string {
    return this.error.url.split('/').slice(-1)[0];
  }
  constructor() {}

  ngOnInit() {}
}
