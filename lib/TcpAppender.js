const net = require('net');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 5000;

const EVENT_DELIMITER = "\n";

const SHUTDOWN_ATTEMPTS = 3;
const SHUTDOWN_ATTEMPT_TO = 250;

module.exports = class TcpAppender {

	constructor({ host, port, timezoneOffset}, layout) {
		this.host = host || DEFAULT_HOST;
		this.port = port || DEFAULT_PORT;
		this.timezoneOffset = timezoneOffset;
		this.layout = layout;
		this.canWrite = false;
		this.buffer = [];
		this.lastError = null;
		this.createSocket();
	}

	createSocket() {
		// Create socket to configured host:port
		this.socket = net.createConnection(this.port, this.host);
		this.socket.on('connect', () => {
			if (this.lastError) {
				this.logError('Connection restored');
			}
			this.lastError = null;
			this.emptyBuffer();
			this.canWrite = true;
		});
		this.socket.on('drain', () => {
			this.canWrite = true;
			this.emptyBuffer();
		});
		this.socket.on('timeout', () => this.socket.end());
		// Don't reconnect on error - close will be called after anyway
		this.socket.on('error', error => this.handleError(error));
		this.socket.on('close', () => this.createSocket());
	}

	write(event) {
		this.canWrite = this.socket.write(`${this.layout(event)}${EVENT_DELIMITER}`, 'utf8');
	}

	emptyBuffer() {
		let event;
		while ((event = this.buffer.shift())) {
			this.write(event);
		}
	}

	handleError({ stack }) {
		if (!this.lastError || this.lastError !== stack) {
			this.logError(stack);
			this.lastError = stack;
		}
	}

	logError(message) {
		console.error(`${(new Date).toISOString()}	log4js-tcp-appender:${process.pid}	${message}`);
	}

	getLog() {
		const log = (event) => {
			if (this.canWrite) {
				this.write(event);
			} else {
				// Buffering log event because it cannot be written at the moment
				this.buffer.push(event);
			}
		}
		log.shutdown = (callback) => {
			let count = 0;
			if (this.buffer.length && ++count <= SHUTDOWN_ATTEMPTS) {
				setTimeout(() => log.shutdown(callback), SHUTDOWN_ATTEMPT_TO);
			} else {
				this.socket.removeAllListeners('close');
				this.socket.end(callback);
			}
		}
		return log;
	}
}
