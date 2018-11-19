const assert = require('assert');
const net = require('net');

const TcpAppender = require('../lib/TcpAppender');

const port = 37897;
const host = 'localhost';

describe('Logging to TCP', () => {
	let server;
	let messages;
	let socket;

	const startServer = () => new Promise(resolve => {
		server = net.createServer(connection => {
			socket = connection;
			connection.on('data', data => messages += data.toString('utf8'));
		});
		server.listen(port, host, () => resolve());
	});

	beforeEach(async () => {
		messages = '';
		await startServer();
	});

	afterEach(async () => {
		await new Promise(resolve => server.close(resolve));
	});

	it('Should log message applying layout', async () => {
		const appender = new TcpAppender(
			{ host, port, timezoneOffset: 0 },
			msg => `layout(${msg})`,
		);
		const log = appender.getLog();
		log('ABC');
		log('DFG');
		await new Promise(resolve => setTimeout(resolve, 50));
		await new Promise(resolve => log.shutdown(resolve));
		assert.deepEqual('layout(ABC)\nlayout(DFG)\n', messages);
	});

	it('Should survive server unavailability', async () => {
		const appender = new TcpAppender(
			{ host, port, timezoneOffset: 0 },
			msg => msg,
		);
		const log = appender.getLog();
		log('ABC');
		await new Promise(resolve => {
			server.close(resolve);
			socket.destroy();
		});
		log('DFG');
		await startServer();
		log('FJK');
		await new Promise(resolve => setTimeout(resolve, 50));
		await new Promise(resolve => log.shutdown(resolve));
		assert.deepEqual('ABC\nDFG\nFJK\n', messages);
	});

});
