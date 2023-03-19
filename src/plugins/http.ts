import axios from 'axios';
import type { Command, Plugin } from "@launch-deck/common";

export default {

    ns: '@launch-deck/http-plugin',

    async handleCommand(command: Command): Promise<void> {

        const url = command.data?.url;
        const method = command.data?.method || 'get';
        const body = command.data?.body;

        if (url && method) {
            switch (method) {
                case 'get':
                    await axios.get(url);
                    break;
                case 'post':
                    await axios.post(url, body);
                    break;
                case 'put':
                    await axios.put(url, body);
                    break;
                case 'patch':
                    await axios.patch(url, body);
                    break;
                case 'delete':
                    await axios.delete(url);
                    break;
                case 'head':
                    await axios.head(url);
                    break;
                case 'options':
                    await axios.options(url);
                    break;
            }
        }
    },

    getCommands(): Promise<Command[]> {

        const commands: Command[] = [
            {
                name: 'Http Request',
                type: 0,
                commandInputs: {
                    method: {
                        name: "Method",
                        type: 'select',
                        selectionOptions: [
                            { name: 'Get', data: 'get' },
                            { name: 'Post', data: 'post' },
                            { name: 'Put', data: 'put' },
                            { name: 'Patch', data: 'patch' },
                            { name: 'Delete', data: 'delete' },
                            { name: 'Head', data: 'head' },
                            { name: 'Options', data: 'options' }
                        ]
                    },
                    url: { name: 'Url', type: 'value' },
                    body: { name: 'Body', type: 'text' }
                }
            }
        ];

        return Promise.resolve(commands);
    }

} as Plugin;
