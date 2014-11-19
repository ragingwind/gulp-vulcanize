'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var vulcanize = require('vulcanize');

module.exports = function (options) {
	options = options || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-vulcanize', 'Streaming not supported'));
			return;
		}

		options.input = file.path;
		options.inputSrc = file.contents;
		if (!options.output) {
			// using same name of input file
			options.output = path.basename(file.path);
		} else {
			if (typeof options.output === 'function') {
				// excute filter function
				options.output = options.output(file.path);
			} else if (typeof options.output !== 'string') {
				cb(new gutil.PluginError('gulp-vulcanize', 'output is unknown type'));
				return;
			}
		}
		options.outputHandler = function(filename, data, finished) {
			this.push(new gutil.File({
				cwd: file.cwd,
				base: file.base,
				path: path.join(file.base, path.basename(filename)),
				contents: new Buffer(data)
			}));

			if (finished) {
				cb();
			}
		}.bind(this);

		vulcanize.setOptions(options, function () {});

		try {
			vulcanize.processDocument();
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-vulcanize', err, {fileName: file.path}));
		}
	});
};
