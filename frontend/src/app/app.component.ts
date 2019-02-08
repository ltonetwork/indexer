import { Component } from '@angular/core';
import { sha256 } from 'js-sha256';
import { HttpClient } from '@angular/common/http';
import { take, tap, finalize, shareReplay } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatSnackBar } from '@angular/material';

type InputType = 'Text' | 'File';

interface FileHash {
  hex: string;
  base58: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  selectedFileData: ArrayBuffer | null = null;
  textInput = '';

  inputType: InputType = 'File';
  verifying = false;
  verification$: Observable<any> | null = null;

  get hash(): string {
    const data =
      this.inputType === 'Text' ? this.textInput : this.selectedFileData;
    if (data && data !== '') {
      const hash = sha256(data);
      return hash;
    }

    return '';
  }

  private _host = '';

  constructor(private _http: HttpClient, private _snackbar: MatSnackBar) {}

  get cantVerify() {
    if (this.verifying) {
      return true;
    }
    return this.inputType === 'Text'
      ? this.textInput === ''
      : this.selectedFileData === null;
  }

  setInputType(type: InputType) {
    if (type !== this.inputType) {
      this.inputType = type;
      this.selectedFileData = null;
      this.textInput = '';
    }
  }

  fileSelected(data: ArrayBuffer) {
    this.selectedFileData = data;
  }

  verify() {
    this.verifying = true;
    this.verification$ = this._http
      .get<any>(`${this._host}/hash/${this.hash}`)
      .pipe(finalize(() => (this.verifying = false)));
  }

  anchor(hash: string) {
    this.verification$ = this._http
      .post(`${this._host}/hash`, { hash: this.hash })
      .pipe(
        tap(() => {
          this._showNotification(
            'Your hash has been anchored on the blockchain.',
          );
        }),
      );
  }

  buildExplorerUrl(verification: any) {
    const transaction = verification.chainpoint.anchors[0].sourceId;
    const hash = this.hash;
    return `https://testnet-explorer.lto.network/transaction/${transaction}?hash=${hash}`;
  }

  private _showNotification(message: string) {
    this._snackbar.open(message, 'DISMISS');
  }
}
