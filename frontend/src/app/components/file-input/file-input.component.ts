import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { sha256 } from 'js-sha256';
import { EncoderService } from '../../encoder.service';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
})
export class FileInputComponent implements OnInit {
  @Output()
  fileHash = new EventEmitter<{
    hex: string;
    base58: string;
  }>();

  @Output()
  fileData = new EventEmitter();

  fileName = '';

  constructor(public encoder: EncoderService) {}

  ngOnInit() {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.fileName = file.name;
    this._readFile(file);
  }

  private _readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this._generateHash(reader.result);
      this.fileData.next(reader.result);
    };

    reader.readAsArrayBuffer(file);
  }

  private _generateHash(buffer: any) {
    const hex = sha256(buffer);
    const shaBuffer = sha256.digest(buffer);

    this.fileHash.next({
      hex,
      base58: this.encoder.base58Encode(shaBuffer),
    });
  }
}
