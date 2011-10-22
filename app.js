var fcgiApp = require("./fcgi"),
	http = require("http"),
	fs = require('fs'),
	path = require('path'),
	url = require('url');

var STATIC_ROOT = path.join(__dirname, 'public_html');

var proxy = http.createServer(function(req, res) {
	if(req.path.length <= 1 && req.path.charAt(0) == '/') { // Empty path
		// serve the index page
		var indexPath = path.join(STATIC_ROOT, 'index.html');
		var stat = fs.statSync(indexPath);
		
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': stat.size
		});
		
		var contents = fs.createReadStream(indexPath);
		contents.on('data', function(chunk) { res.write(chunk); });
		contents.on('end', function() { res.end(); });
	} else {
		// extract the target url
		var requestUrl =req.path.charAt(0) == '/' ? req.path.substr(1) : req.path;
		var parsedRequestUrl = url.parse(requestUrl);
		
		// make a request to the url, replicating headers + method
		var requestOptions = {
			host: parsedRequestUrl.host,
			path: parsedRequestUrl.hash,
			method: req.method
		};
		
		http.request(requestOptions, function(proxyRes) {
			// write the received content back to user, rewriting as neccessary
			res.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.on('data', function(chunk) { res.write(chunk); });
			proxyRes.on('end', function() { res.end(); });
		});
	}
});

// bare node.js deployment
proxy.listen(12345);

// fluxflex deployment
// fcgiApp.handle(proxy);