'use strict';

var assert = require('assert');

var fpmServiceCreator = require('../index');
var requests = require('./requests');

describe('FPM Service', function(){
	var fpmService = null;
	before(function(done){
		fpmService = fpmServiceCreator(connectOptions);
		setTimeout(done, 1000);
	});

	var connectOptions = {
		maxReqsPerWorker: 1000
	};

	it('Execute PHP helloworld', function(done){
		requests.helloworld(fpmService, done);
	});

	it('Execute PHP helloworld * 100', function(done){
		this.timeout(10000);
		requests.helloworldBatch(100, fpmService, done);
	});

	it('Execute PHP helloworld * 100 (With Delay)', function(done){
		this.timeout(10000);
		requests.helloworldBatchWithDelay(100, 1, fpmService, done);
	});

	it('Execute PHP helloworld * 100 (Series)', function(done){
		this.timeout(10000);
		requests.helloworldBatchSeries(100, fpmService, done);
	});
});
