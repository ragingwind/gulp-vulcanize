'use strict';
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var mkdirp = require('mkdirp');
var vulcanize = require('vulcanize');

module.exports = function (options) {
	options = options || {};

	if (!options.dest) {
		throw new gutil.PluginError('gulp-vulcanize', '`dest` required');
	}

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-vulcanize', 'Streaming not supported'));
			return;
		}

		var self = this;
		var destFilename = path.join(options.dest, options.output || path.basename(file.path));
		options.input = path.join(path.dirname(file.path), '.' + path.basename(file.path));
		options.output = destFilename;
		vulcanize.setOptions(options, function () {});

		mkdirp(options.dest, function (err) {
			if (err) {
				cb(new gutil.PluginError('gulp-vulcanize', err, {fileName: file.path}));
				return;
			}

			fs.writeFileSync(options.input, file.contents);
			vulcanize.processDocument();
			fs.unlinkSync(options.input);

			fs.readFile(destFilename, function (err, data) {
				if (err) {
					cb(new gutil.PluginError('gulp-vulcanize', err, {fileName: file.path}));
					return;
				}

				var html = data;

				fs.readFile(gutil.replaceExtension(destFilename, '.js'), function (err, data) {
					if (err && err.code !== 'ENOENT') {
						cb(new gutil.PluginError('gulp-vulcanize', err, {fileName: file.path}));
						return;
					}

					self.push(new gutil.File({
						cwd: file.cwd,
						base: file.base,
						path: file.path,
						contents: html
					}));

					if (data) {
						self.push(new gutil.File({
							cwd: file.cwd,
							base: file.base,
							path: gutil.replaceExtension(file.path, '.js'),
							contents: data
						}));
					}

					cb();
				});
			});
		});
	});
};
