# node-fastcgi-client

Help node.js code visit PHP, and manage PHP workers like Fast PHP Manager (PHP FPM). Use PHP-CGI directly through FastCGI protocol.

# Development Status

Developing. Would be stable soon.

# API

`npm install node-fpm`. Use `require('node-fpm')` to get a `fpmServiceCreator`.

`var fpmService = fpmServiceCreator(options)` Create an FPM service. Available options:

* `portMin` The min value of port used by PHP-CGI, default to 9001.
* `portMax` The max value of port used by PHP-CGI, default to 9099.
* `maxWorkers` The PHP-CGI workers to start, range 1 to max available ports, default to 4.
* `maxReqsPerWorker` The maximum requests to a worker before it is restarted, range 1 to 65535, default to 500.

`fpmService.request(params, cb)` Create a new request.
An error object would be passed to `cb` as 1st argument on failed, otherwise a `request` argument is passed as 2nd argument.

The `request` object:

* `request.abort()` Send an abort request. The request is not ended after the server responds.
* `request.stdin` The writable stdin stream.
* `request.stdout` The readable stdout stream.
* `request.stderr` The readable stderr stream.
* `request.getExitStatus()` Return exit code, or an error if not normally ended. It would be ready before the `end` events of stdout and stderr streams.

# test

You should have PHP-CGI installed and available as "php-cgi" command.

Then use `npm test` to test. Use `npm run coverage` to see the test coverage.

# LICENSE

MIT
