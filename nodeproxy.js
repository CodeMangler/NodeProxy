var http = require("http"),
	fs = require('fs'),
	path = require('path'),
	url = require('url'),
	util = require('util');

var STATIC_ROOT = path.join(__dirname, 'public_html');

function value(variable, defaultValue) {
	return variable ? variable : defaultValue;
}

var proxy = http.createServer(function(req, res) {
	// DEFECT: req.url doesn't have the hash parameters.. i.e. requesting foo.bar/path#hash results in a request that has only foo.bar/path (#hash stripped off)
	var requestUrl = req.url.charAt(0) == '/' ? req.url.substr(1) : req.url;
	if(requestUrl == '')
		requestUrl = 'index.html'; // Default resource to serve
	
	var staticPath = path.join(STATIC_ROOT, requestUrl);
	var isStaticResource = path.existsSync(staticPath);
	if(isStaticResource) {
		// serve the resource
		var stat = fs.statSync(staticPath);
		
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': stat.size
		});
		
		var contents = fs.createReadStream(staticPath);
		contents.on('data', function(chunk) { res.write(chunk); });
		contents.on('end', function() { res.end(); });
	} else {
		// extract the target url
		var parsedRequestUrl = url.parse(requestUrl);

		// make a request to the url, replicating headers + method
		var requestOptions = {
			host: parsedRequestUrl.host,
			port: 80,
			path: value(parsedRequestUrl.pathname, '/') + value(parsedRequestUrl.search, '') + value(parsedRequestUrl.hash, ''),
			method: req.method
		};

		var proxyRequest = http.request(requestOptions, function(proxyRes) {
			// write the received content back to user, rewriting as neccessary
			res.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.on('data', function(chunk) { res.write(chunk); });
			proxyRes.on('end', function() { res.end(); });
		});
		
		req.on('data', function(chunk) { proxyRequest.write(chunk); });
		req.on('end', function() { proxyRequest.end(); });
		
		proxyRequest.on('error', function(e) {
			console.log(e.message);
			console.log(util.inspect(e));
		});
	}
});

proxy.on('error', function(e) {
	console.log(e.message);
	console.log(util.inspect(e));
});

exports.proxy = proxy;