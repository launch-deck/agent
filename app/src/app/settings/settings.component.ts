import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import type { AgentData, Settings } from '@launch-deck/common';
import { DataService } from 'src/app/services/data.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

    selectedImage: string;
    settings: Settings;

    qrUrl = this.dataService.data.pipe(
        map((agentData: AgentData) => location.origin + "?agent=" + agentData.agentCode)
    );

    // Prevent input from showing content over 512 chars
    get imageUrl(): string {
        return this.selectedImage?.substring(0, 512);
    };
    set imageUrl(val: string) {
        this.selectedImage = val;
    }

    constructor(private dataService: DataService) { }

    async ngOnInit(): Promise<void> {
        await this.reload();
    }

    async cancel(): Promise<void> {
        await this.reload();
    }

    async onSave(): Promise<void> {
        this.settings.coreSettings = this.settings.coreSettings || {};
        this.settings.coreSettings.backgroundImageUrl = this.selectedImage;
        await this.dataService.updateSettings(this.settings);
    }

    previewImage(fileInputEvent: Event) {
        const file = (fileInputEvent.target as any)?.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            // convert image file to base64 string
            this.selectedImage = reader.result as string;
        }, false);

        if (file) {
            if (file.size > 2097152) {
                alert("File is too big!");
            } else {
                reader.readAsDataURL(file);
            }
        }
    }

    hasPluginSettings(pluginSettings: any): boolean {
        return Object.keys(pluginSettings).length > 0;
    }

    updatePluginSetting(pluginKey: string, settingKey: string, event: Event) {
        this.settings.pluginSettings[pluginKey][settingKey] = (event.target as any)?.value ?? "";
    }

    /**
     * Sorts the key value pairs by the original object property order
     */
    originalOrder = (a: KeyValue<string, string>, b: KeyValue<string, string>): number => {
        return 0;
    }

    private async reload(): Promise<void> {
        const data = await firstValueFrom(this.dataService.data);

        this.settings = data.settings;

        if (this.settings.coreSettings?.backgroundImageUrl) {
            this.selectedImage = this.settings.coreSettings.backgroundImageUrl;
        }
    }
}
