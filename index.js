const TcpAppender = require('./lib/TcpAppender');

module.exports.configure = function(config, layouts) {
	const { layout } = config;
	const appender = new TcpAppender(config, layout ? layouts.layout(layout.type, layout) : layouts.dummyLayout);
	return appender.getLog();
}
