export interface WorkerMessage {
    action: 'exit' | 'handleCommand' | 'getCommands' | 'getSettingsKeys' | 'loadSettings' | 'event';
    type?: string;
    data?: any;
}
