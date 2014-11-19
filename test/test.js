'use strict';
var assert = require('assert');
var fs = require('fs');
var gutil = require('gulp-util');
var vulcanize = require('../');
var path =require('path');

function vulcanizeStream (opts) {
	var stream = vulcanize(opts);

	stream.writeWithPath = function(filepath) {
		stream.write(new gutil.File({
			cwd: __dirname,
			base: path.dirname(filepath),
			path: filepath,
			contents: fs.readFileSync(filepath)
		}));
	}

	return stream;
}

// extend assert.equal
assert.equalWithExpectedFile = function(actual, expectedFile) {
	assert.equal(actual, fs.readFileSync(__dirname + '/expected/' + expectedFile, 'utf8').replace(/\r?\n$/, ''));
}

describe('should vulcanize web components', function() {
	it ('simple-usage', function(cb) {
		var stream = vulcanizeStream({
			csp: true
		});

		stream.on('data', function (file) {
			if (/\.html$/.test(file.path)) {
				assert.equal(file.relative, 'index.html');
				assert(/Imported/.test(file.contents.toString()));
				return;
			}

			assert.equal(file.relative, 'index.js');
			assert(/Polymer/.test(file.contents.toString()));
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/simple-usage/index.html');

		stream.end();
	});

	it ('change output name by string', function(cb) {
		var stream = vulcanizeStream({
			csp: true,
			output: 'vulcanized.html'
		});

		stream.on('data', function (file) {
			if (/\.html$/.test(file.path)) {
				assert.equal(file.relative, 'vulcanized.html');
				assert(/Imported/.test(file.contents.toString()));
				return;
			}

			assert.equal(file.relative, 'vulcanized.js');
			assert(/Polymer/.test(file.contents.toString()));
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/simple-usage/index.html');

		stream.end();
	});

	it ('change output name by filter function', function(cb) {
		var stream = vulcanizeStream({
			csp: true,
			output: function (filepath) {
				return path.join(path.dirname(filepath), 'whatever.html');
			}
		});

		stream.on('data', function (file) {
			if (/\.html$/.test(file.path)) {
				assert.equal(file.relative, 'whatever.html');
				assert(/Imported/.test(file.contents.toString()));
				return;
			}

			assert.equal(file.relative, 'whatever.js');
			assert(/Polymer/.test(file.contents.toString()));
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/simple-usage/index.html');

		stream.end();
	});
});

describe('should vulcanize web components as expected with', function() {
	it('default', function (cb) {
		var stream = vulcanizeStream({
			output: process.cwd() + '/tmp/default/vulcanized.html'
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(), 'default/vulcanized.html');
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});

	it('abspath', function (cb) {
		var stream = vulcanizeStream({
			abspath: path.resolve('test/fixtures/'),
			output: process.cwd() + '/tmp/abspath/vulcanized.html'
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(), 'abspath/vulcanized.html');
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});

	it('csp', function (cb) {
		var stream = vulcanizeStream({
			output: process.cwd() + '/tmp/csp/vulcanized.html',
			csp: true
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(),
					'csp/vulcanized' + path.extname(file.path));
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});

	it('inline', function (cb) {
		var stream = vulcanizeStream({
			inline: true,
			output: process.cwd() + '/tmp/inline/vulcanized.html'
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(), 'inline/vulcanized.html');
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});

	it('excludes', function (cb) {
		var stream = vulcanizeStream({
			excludes: {
	        	imports: ['polymer.html']
	        },
			output: process.cwd() + '/tmp/excludes/vulcanized.html'
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(), 'excludes/vulcanized.html');
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});

	it('strip', function (cb) {
		var stream = vulcanizeStream({
			strip: true,
			output: process.cwd() + '/tmp/strip/vulcanized.html'
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(), 'strip/vulcanized.html');
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});

	it('multiple', function (cb) {
		var count = 2;
		['one.html', 'two.html'].forEach(function(target) {
			var stream = vulcanizeStream({
				output: process.cwd() + '/tmp/multiple/' + target
			});

			stream.on('data', function (file) {
				assert.equalWithExpectedFile(file.contents.toString(), 'multiple/' + target);
			});

			stream.on('end', function() {
				if (--count === 0) {
					cb();
				}
			});

			stream.writeWithPath(__dirname + '/fixtures/index.html');

			stream.end();
		});
	});

	it('no-strip-excludes', function (cb) {
		var stream = vulcanizeStream({
			'strip-excludes': false,
			excludes: {
				imports: ['polymer.html']
			},
			output: process.cwd() + '/tmp/no-strip-excludes/vulcanized.html'
		});

		stream.on('data', function (file) {
			assert.equalWithExpectedFile(file.contents.toString(), 'no-strip-excludes/vulcanized.html');
		});

		stream.on('end', cb);

		stream.writeWithPath(__dirname + '/fixtures/index.html');

		stream.end();
	});
});
