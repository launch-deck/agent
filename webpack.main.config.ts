import type { Configuration } from 'webpack';
import CopyPlugin from "copy-webpack-plugin";
import path from 'path';

export const mainConfig: Configuration = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/index.ts',
    // Put your normal webpack config below here
    module: {
        rules: [
            // Add support for native node modules
            {
                // We're specifying native_modules in the test because the asset relocator loader generates a
                // "fake" .node file which is really a cjs file.
                test: /native_modules[/\\].+\.node$/,
                use: 'node-loader',
            },
            {
                test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
                parser: { amd: false },
                use: {
                    loader: '@vercel/webpack-asset-relocator-loader',
                    options: {
                        outputAssetBase: 'native_modules',
                    },
                },
            },
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|\.webpack)/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, "worker-thread", "plugin-worker-thread.js") },
                { from: "node_modules/ws", to: "node_modules/ws" },
                { from: "node_modules/eventsource", to: "node_modules/eventsource" },
            ],
        })
    ],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    }
};
