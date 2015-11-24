'use strict';

var childProcess = require('child_process');
var fcgiClientCreator = require('fastcgi-client');

module.exports = function(options){
	options = options || {};
	var portMin = options.portMin || 9001;
	var portMax = options.portMax || 9099;
	var workers = options.workers || 4;
	var maxReqsPerWorker = options.maxReqsPerWorker || 500;

	var createServer = function(port, cb){
		// start a PHP-CGI
		var phpProc = childProcess.spawn('php-cgi', ['-b', '127.0.0.1:' + port], {stdio: 'ignore'});
		phpProc.on('error', function(err){
			if(cb) cb();
			cb = null;
		});
		phpProc.on('exit', function(code, signal){
			if(cb) cb(code, signal);
			cb = null;
		});
		return phpProc;
	};

	var createClient = function(port, cb){
		// create a client
		return fcgiClientCreator({
			host: '127.0.0.1',
			port: port,
			maxReqs: maxReqsPerWorker,
			mpxsConns: 1,
			skipCheckServer: true
		});
	};

	// port alloc
	var curPort = portMin;
	var allocPort = function(){
		if(curPort > portMax) return 0;
		return curPort++;
	};

	// clients manager
	var clients = new Array(workers);
	var initClient = function(index){
		var port = allocPort();
		if(!port) {
			clients[index] = null;
			return;
		}
		var client = {
			fcgiServer: null,
			fcgiClient: null,
			reqs: 0 // TODO make maxReqsPerWorker works
		};
		var startClient = function(){
			client.fcgiClient = createClient(port);
			client.fcgiClient.once('ready', function(){
				clients[index] = client;
			});
		};
		var restartServer = function(){
			client.proc = createServer(port, function(exitCode, signal){
				if(arguments.length === 0) {
					// error to fork PHP-CGI
					clients[index] = null;
					return;
				}
				if(exitCode === 255 && !signal) {
					// exit with port in use or some other faults
					initClient(index);
				} else {
					restartServer();
				}
			});
		};
		startClient();
		restartServer();
	};
	process.on('exit', function(){
		// kill child processes on exit
		for(var i=0; i < clients.length; i++) {
			var client = clients[i];
			if(!client || !client.fcgiServer) continue;
			client.fcgiServer.kill();
		}
	});
	for(var i=0; i < workers; i++) {
		initClient(i);
	}

	// request scheduler
	var queue = [];
	var roundRobinSuccess = clients.length - 1;
	var roundRobinNext = 0;
	var allocReq = function(cb){
		var reqData = queue.shift();
		if(!reqData) return cb(true);
		var selectNext = function(){
			if(roundRobinNext >= clients.length) roundRobinNext = 0;
			var clientId = roundRobinNext++;
			if(!clients[clientId]) {
				if(clientId === roundRobinSuccess) {
					// failed to find available server
					queue.unshift(reqData);
					cb(true);
				} else {
					selectNext();
				}
				return;
			}
			clients[clientId].fcgiClient.request(reqData[0], function(err, request){
				if(err) {
					if(clientId === roundRobinSuccess) {
						// failed to find available server
						queue.unshift(reqData);
						cb(true);
					} else {
						selectNext();
					}
				} else {
					roundRobinSuccess = clientId;
					cb();
					reqData[1].call(global, null, request);
				}
			});
		};
		selectNext();
	};
	var queueTriggered = false;
	var triggerQueue = function(){
		if(queueTriggered) return;
		queueTriggered = true;
		setImmediate(function(){
			queueTriggered = false;
			// TODO improve trigger queue strategy
			allocReq(function(err){
				if(err) {
					setTimeout(triggerQueue, 100);
					return;
				}
				triggerQueue();
			});
			// TODO add other trigger queue points
		});
	};

	// API
	var request = function(params, cb){
		queue.push([params, cb]);
		triggerQueue();
	};
	var cancel = function(reqId){
		// TODO
	};

	return {
		request: request,
		cancel: cancel
	};
};
