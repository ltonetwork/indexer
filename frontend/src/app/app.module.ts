import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FileDropModule } from 'ngx-file-drop';
import { NgSuspenseModule } from 'ng-suspense';
import {
  MatToolbarModule,
  MatButtonModule,
  MatIconModule,
  MatMenuModule,
  MatCardModule,
  MatInputModule,
  MatFormFieldModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
} from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileInputComponent } from './components/file-input/file-input.component';
import { VerificationErrorComponent } from './components/verification-error/verification-error.component';

@NgModule({
  declarations: [AppComponent, FileInputComponent, VerificationErrorComponent],
  imports: [
    BrowserModule,
    FileDropModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    NgSuspenseModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
