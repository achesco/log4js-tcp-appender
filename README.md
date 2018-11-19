# log4js-tcp
TCP appender for log4js-node logger with layouts and errors handling

## Usage

Install appender

```bash
npm i log4js-tcp-appender
```

Configure log4js using appender

```js
log4js.configure({
	appenders: {
		splunk: {
			type: 'log4js-tcp-appender',
			host: 'splunk.host',
			port: 6789,
			layout: {
				type: 'custom_or_builtin_layout',
			},
		},
	},
	categories: {
		default: {
			appenders: ['splunk'],
			level: 'info',
		},
	},
}); 
```

### Note on error handling

Occurring socket errors will be logged to STDERR. Appender tries to reconnect on 'close' socket event, same happens on 'error' event by simply handling following 'close' event. This may lead to repeating connection error. Keeping in mind this case, appender will only log distinct error messages, comparing every occurring error to previous. Also will write notification message on successful re-connection.

Sample STDERR output in case of temporary connection unavailability:

```
# Messages are being logged normally here

2018-11-19T15:37:38.511Z	log4js-tcp-appender:40348	Error: connect ECONNREFUSED 127.0.0.1:8001
	at Object.exports._errnoException (util.js:1024:11)
	at exports._exceptionWithHostPort (util.js:1047:20)
	at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1150:14)

# Lots of omitted by appender error messages same as the above

2018-11-19T15:37:44.963Z	log4js-tcp-appender:40348	Connection restored

# Messages are being logged normally here
```

Notes:
* could be grepped by 'log4js-tcp-appender' substring
* in sample output log4js-tcp-appender:40348 - PID added after the colon

