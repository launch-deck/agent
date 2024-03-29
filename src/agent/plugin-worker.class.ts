import { filter, firstValueFrom, Subject, Subscription } from 'rxjs';
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import { WorkerMessage } from './worker-message.interface';
import type { Command, Plugin } from "@launch-deck/common";
import { log, error } from 'electron-log';
import { join } from "path";

export class PluginWorker implements Plugin {

    ns: string;
    events: EventEmitter = new EventEmitter();

    started: boolean = false;

    private worker?: Worker;
    private messages: Subject<WorkerMessage> = new Subject();
    private sub?: Subscription;
    private settingsKeys?: string[];
    private loadedSettings?: { [key: string]: string; };

    constructor(private pluginInfo: any) {
        this.ns = this.pluginInfo.name;
    }

    async start(): Promise<void> {
        if (this.started) {
            return;
        }

        try {
            this.worker = new Worker(join(__dirname, 'plugin-worker-thread.js'), { workerData: this.pluginInfo });
        } catch (e) {
            error(`Failed to start plugin worker: ${this.ns}`, e);
            return;
        }

        this.worker.on('message', (message) => this.messages.next(message));
        this.worker.on('error', (e) => error(`${this.ns} Worker error: ${e}`));
        this.worker.on('exit', (code) => log(`${this.ns} Worker stopped with exit code ${code}`));

        this.settingsKeys = await this._getSettingsKeys();

        if (this.loadedSettings) {
            await this._loadSettings(this.loadedSettings);
        }

        this.sub = this.messages.pipe(
            filter(message => message.action === 'event' && !!message.type),
        ).subscribe(message => {
            this.events.emit(message.type as string, message.data);
        });

        this.started = true;

        log(`Plugin started: ${this.ns}`);
    }

    stop(): void {
        if (!this.started) {
            return;
        }
        this.sub?.unsubscribe();
        this.sendMessage({ action: 'exit' });
        this.worker?.removeAllListeners();
        this.worker = undefined;
        this.started = false;

        log(`Plugin stopped: ${this.ns}`);
    }

    async handleCommand(command: Command): Promise<void> {
        await this.sendMessageWait({ action: 'handleCommand', data: command });
    }

    async getCommands(): Promise<Command[]> {
        var res = await this.sendMessageWait({ action: 'getCommands' });
        return res || [];
    }

    getSettingsKeys(): string[] {
        return this.settingsKeys || [];
    }

    loadSettings(settings: { [key: string]: string; }): void {
        this._loadSettings(settings);
    }

    private async _getSettingsKeys(): Promise<string[]> {
        var res = await this.sendMessageWait({ action: 'getSettingsKeys' });
        return res || [];
    }

    private async _loadSettings(settings: { [key: string]: string; }): Promise<void> {
        this.loadedSettings = settings;
        await this.sendMessageWait({ action: 'loadSettings', data: settings });
    }

    private sendMessage(message: WorkerMessage): void {
        this.worker?.postMessage(message);
    }

    private async sendMessageWait(message: WorkerMessage): Promise<any> {
        var response = firstValueFrom(this.messages.pipe(
            filter(res => res.action === message.action)
        ));
        this.sendMessage(message);
        return (await response).data;
    }

}
