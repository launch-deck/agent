import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QRCodeModule } from 'angularx-qrcode';

import { AppComponent } from './app.component';
import { TileEditComponent } from './tile-edit/tile-edit.component';
import { CommandComponent } from './command/command.component';
import { TileGridComponent } from './tile-grid/tile-grid.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { ContextBridgeService } from './services/context-bridge.service';
import { ConnectionComponent } from './connection/connection.component';
import { PluginsComponent } from './plugins/plugins.component';

@NgModule({
    declarations: [
        AppComponent,
        TileEditComponent,
        CommandComponent,
        TileGridComponent,
        SettingsComponent,
        ProfileComponent,
        ConnectionComponent,
        PluginsComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ClipboardModule,
        DragDropModule,
        FormsModule,
        HammerModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatDialogModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatRippleModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatTooltipModule,
        QRCodeModule,
    ],
    providers: [ContextBridgeService],
    bootstrap: [AppComponent]
})
export class AppModule { }
