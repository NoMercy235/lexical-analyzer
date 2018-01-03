var copyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var argv = require('yargs').argv;
var pack = require('./package.json');

var _basePath = __dirname + (argv.p?'/build':'/dev');
var _rootPath = __dirname;

var _dev = !argv.p;

var entries = {
    vendor : "./app/vendor",
    app : "./app/main",                  
    templates : "./app/templates"
};

function orderChunks(a, b){
    if(a.names[0] === 'vendor') return -1;
    if(b.names[0] === 'vendor') return 1;
    if(a.names[0] === 'templates') return 1;
    if(b.names[0] === 'templates') return -1; 

    return 0;
}

module.exports = {
    entry: entries,
    output: {
        path: _basePath,
        filename: "./dist/[name].bundle.js"
    },
    resolve: {
        extensions: ['', '.ts', '.js'],
        modulesDirectories: ["web_modules", "node_modules", "bower_components"]
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: 'style-loader!css-loader' },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/, loader : 'file-loader'},
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" },
            { test: /\.html$/, loader: 'html-loader', exclude: /node_modules/ },
            { test: /\.ts/, loader: 'ts-loader!angular2-template-loader', exclude: /node_modules/ }
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"./dist/vendor.bundle.js"),
		new webpack.DefinePlugin({
             // global variables                          
	        _dev: _dev,
	        _rootPath: JSON.stringify(_rootPath),
	        _version: JSON.stringify(pack.version)
	    }),
        new webpack.ProvidePlugin({   
            jQuery: 'jquery',
            $: 'jquery',
            jquery: 'jquery'
        }),
		new HtmlWebpackPlugin({
			template: __dirname + '/index.html',
			// favicon: __dirname + '/src/favicon.png',
			chunksSortMode: orderChunks,
			inject: 'footer',
			xhtml: true,
		})
    ]
}

if (_dev) {
	module.exports.devtool = 'eval-source-map';
}

