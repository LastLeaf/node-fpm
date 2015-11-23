'use strict';

var childProcess = require('child_process');
var fcgiClientCreator = require('fastcgi-client');

module.exports = function(options){
	options = options || {};
	var portMin = options.portMin || 9001;
	var portMax = options.portMax || 9099;
	var maxWorkers = options.maxWorkers || 4;
	var maxReqsPerWorker = options.maxReqsPerWorker || 500;

	var createClient = function(port, readyCb, cb){
		// start a PHP-CGI
		var phpProc = childProcess.spawn('php-cgi', ['-b', '127.0.0.1:' + port], {stdio: 'ignore'});
		phpProc.on('error', function(err){
			if(cb) cb();
			cb = null;
		});
		phpProc.on('exit', function(code, signal){
			if(cb) cb(code);
			cb = null;
		});
		// create a client
		var fcgiClient = fcgiClientCreator({
			host: '127.0.0.1',
			port: port,
			maxReqs: maxReqsPerWorker,
			mpxsConns: 1,
			skipCheckServer: true
		});
		// TODO wait several ms before ready callback
		setTimeout(function(){
			if(cb) readyCb();
		}, 1000);
	};

	// clients manager
	var clients = [];
	var curPort = portMin;

	// request scheduler
};
