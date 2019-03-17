const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');

const nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });


module.exports = {
    mode: 'none',
    entry: './src/index.ts',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'index.js',
        libraryTarget: "commonjs2",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ],
    },
    devtool: 'inline-source-map',
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },

    plugins: [
        new CopyPlugin(['package.json','src/game.json',]),
    ],
    externals: nodeModules
}
