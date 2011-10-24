var fcgiApp = require('./fcgi'),
	nodeproxy = require('./nodeproxy');
fcgiApp.handle(nodeproxy.proxy);
