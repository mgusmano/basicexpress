import { cors } from './cors.js'

export const loggerutil = (req, res, next) => {
	//console.log('**req: ' + req.method + ' ' + req.originalUrl + ' ' + req.user);
	//console.log(req.referer)
	//console.log(req.headers.referer)
	process.badaClientUrl = req.headers.referer
	//console.log('**logger: ' + ' ' + process.badaClientUrl);

	console.log('**logger: ' + req.method + ' ' + req.originalUrl + ' ' + process.badaClientUrl);
	// if (req.originalUrl === '/product') {
	// 	var origin = req.get('origin');
	// 	//console.log(origin)
	// 	process.origin = origin
	// 	console.log("herenow")
	// 	//if (origin == 'http://localhost')
	// }
	next();
}

export const corsutil = (req, res, next) => {
	var options = {
		origin: '*',
		credentials: true,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		preflightContinue: true,
		optionsSuccessStatus: 200,
		allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
	}
	cors(options, req, res, next)
	// next()
}

export const headerutil = (req, res, next) => {
	process.CLIENT_URL = req.headers.origin
	// console.log('origin',req.headers.origin)
	// console.log(req.headers.origin)
	res.header('Access-Control-Allow-Credentials', true);
	// res.header('Access-Control-Allow-Origin', "*");
	// if (process.env.GAE_ENV){
	// 	res.header('Access-Control-Allow-Origin', "https://frontend-test-pxir6mxkra-uc.a.run.app/, https://badabingmp.com");
	// }
	// else{
		res.header('Access-Control-Allow-Origin', req.headers.origin);
	// }
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
	if ('OPTIONS' == req.method) {
		res.sendStatus(200);
	} else {
		next();
	}
}
