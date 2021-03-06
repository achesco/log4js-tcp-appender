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

Occurring socket errors will be logged to STDERR. Appender tries to reconnect on 'close' socket event,
same happens on 'error' event by simply handling following 'close' event. This may lead to repeating
connection error. Keeping in mind this case, appender will only log distinct error messages, comparing
every occurring error to the last 10. Also will write notification message on successful re-connection.

Sample STDERR output in case of temporary connection unavailability:

```
# Messages are being logged normally here

2018-11-19T15:37:38.500Z	log4js-tcp-appender:40348	Error: connect ECONNREFUSED 10.0.0.101:8001
	at Object.exports._errnoException (util.js:1024:11)
	...

2018-11-19T15:37:38.600Z	log4js-tcp-appender:40348	Error: connect ECONNREFUSED 10.0.0.102:8001
	at Object.exports._errnoException (util.js:1024:11)
	...

2018-11-19T15:37:38.700Z	log4js-tcp-appender:40348	Error: connect ECONNREFUSED 10.0.0.103:8001
	at Object.exports._errnoException (util.js:1024:11)
	...

# Lots of omitted by appender error messages same as the three above

2018-11-19T15:37:44.963Z	log4js-tcp-appender:40348	Connection restored

# Messages are being logged normally here
```

Comparing each error instance to the last ten, cures the case when receiving side being
load-balanced and returns new ip for each sequential ougoing connection try.

Notes:
* could be grepped by 'log4js-tcp-appender' substring
* in sample output log4js-tcp-appender:40348 - PID added after the colon

