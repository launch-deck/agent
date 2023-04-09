import type { Configuration } from 'webpack';
import CopyPlugin from "copy-webpack-plugin";

import { rules } from './webpack.rules';

export const mainConfig: Configuration = {
    target: "node",
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/index.ts',
    // Put your normal webpack config below here
    module: {
        rules,
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                "./worker-thread/plugin-worker-thread.js"
            ],
        })
    ],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    },
    externals: ['ws']
};
