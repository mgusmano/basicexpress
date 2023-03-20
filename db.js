import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

var _db;

export const initDatabase = async () => {
	try {
		console.log('initializing:',process.which)
		if (process.which === 'sqlite') {
			if (_db) {
				console.warn("Trying to init DB again!");
				return callback(null, _db);
			}
			sqlite3.verbose()
			var filename = './db/card.db'
			console.log('filename',filename)
			_db = await open({
				filename: filename,
				mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
				driver: sqlite3.Database,
			})
			await _db.run('PRAGMA foreign_keys = true')
		}
		// else {
		// //if (process.env.GAE_ENV){
		// 	console.log("initializing pool", process.env.DB_USER)
		// 	const pool = mysql.createPool({
		// 		user: process.env.DB_USER,
		// 		password: process.env.DB_PASS,
		// 		database: process.env.DB_NAME,
		// 		socketPath: process.env.CLOUD_SQL_CONNECTION_NAME
		// 	})
		// 	_db = pool
		// 	console.log("gcloud sql pool success")
		// }
		console.log('initializing success:',process.which)
	} catch (err) {
		console.log(err)
		// ... error checks
	}
}

export const getDB = (res,req) => {
	if (_db === undefined) {
		res.json(getFail(req,'APP_ERROR',2,'database is not defined')) 
	}
	return _db
}

export const getTransaction = async(db,transaction) => {
	if (process.which === 'sqlite') {
		await db.run('BEGIN TRANSACTION')
	}
	else if (process.env.GAE_ENV){
		db.query('START TRANSACTION');
	}
	else {
		transaction = new db.Transaction();
		await transaction.begin();
		return transaction
	}
}

export const setColumn = (column,type,req) => {
	if (req.body[column] !== undefined) {
		return `${column}=${type}${req.body[column]}${type},`
	}
	else {
		return ''
	}
}

class QueryError extends Error {
	constructor(args){
		super(args);
		this.name = "QueryError"
		this.num = 5
	}
}
export const getQuery = (variable, req, res) => {
	let value = req.query[variable]
	if (value === undefined || value === '') {
		throw new QueryError(variable + ' needs to be defined');
	}
	return value
}

class ParamError extends Error {
	constructor(args){
		super(args);
		this.name = "ParamError"
		this.num = 5
	}
}
export const getParam = (variable, req, res) => {
	let value = req.params[variable]
	if (value === undefined || value === '') {
		throw new ParamError(variable + ' needs to be defined');
	}
	return value
}

class BodyError extends Error {
	constructor(args){
		super(args);
		this.name = "BodyError"
		this.num = 5
		this.code = 3
		this.errno = 500
	}
}
export const getBody = (variable, req, res) => {
	let value = req.body[variable]
	if (value === undefined || value === '') {
		throw new BodyError(variable + ' needs to be defined');
	}
	return value
}

export const getFail = (req,code,errno,message) => {
	var user
	if (req.user !== undefined) {
		user = req.user
	}
	else {
		user = {
			userId: ''
		}
	}
	var err = `${req.method} ${req.originalUrl} ${message} userId: ${user.userId}`
	//var err = `${req.route.stack[0].method} ${req.route.stack[0].name} ${message} userId: ${req.user.userId}`
	var d = new Date().toString()
	// fs.writeFileSync('./errors/' + d + '.txt',err)
	console.log('error:',err)
	return {
		status: 'fail',
		method: req.method,
		body: req.body,
		query: req.query,
		route: req.originalUrl,
		data: message,
		error: {
			code: code,
			errno: errno,
			message: message
		}
	}
}

export const getSuccess = (req,data) => {
	return {
		status: 'success',
		method: req.method,
		body: req.body,
		query: req.query,
		route: req.originalUrl,
		data: data
	}
}

export const commit = async(db,transaction) => {
	if (process.which === 'sqlite') {
		await db.run('COMMIT')
	}
	else if (process.env.GAE_ENV){
		await db.promise().query('COMMIT')
	}
	else {
		await transaction.commit();
	}
}

export const rollback = async(db,transaction) => {
	try {
		if (process.which === 'sqlite') {
			await db.run('ROLLBACK')
		}
		else if (process.env.GAE_ENV){
			await db.promise().query('ROLLBACK')
		}
		else {
			await transaction.rollback();
		}
	}
	catch(e) {
		console.log('rollback:',e)
	}
}

export const run = async(db,sql) => {
	var result
	if (process.which === 'sqlite') {
		result = await db.run(sql)
	}
	else if (process.env.GAE_ENV){
		result = await db.promise().query(sql)
	}
	else {
		result = await db.query(sql)
		console.log("tried to query " + result)
	}
	return result
}

export const all = async(db,sql) => {
	var result
	if (process.which === 'sqlite') {
		result = await db.all(sql)
		return result
	}
	else if (process.env.GAE_ENV){
		const results = await db.promise().query(sql)
			return results[0]
	}
	else {
		result = await db.query(sql)
		return result.recordsets[0]
	}
}

export const getMSsql = (res) => {
	if (_MSsql === undefined) {
		//console.warn('_MSsql is undefined')
		res.json({error: '_MSsql is undefined' })
	}
	return _MSsql
}

export const initDBMSsql = () => {
	(async () => {
		try {
			//await sql.connect('Server=skillnet.database.windows.net,1433;Database=eCitySchoolTownSN_V5_nl_2019-02-19T20-54Z_2019-02-22T12-42Z;User Id=skillnet;Password=N0rdl0g1c;Encrypt=true')
			await sql.connect('Server=skillnet.database.windows.net,1433;Database=mjgdb;User Id=skillnet;Password=N0rdl0g1c;Encrypt=true')
			_MSsql = sql
	} catch (err) {
		console.log(err)
		// ... error checks
	}
	})()
}

			// for SQL Server on azure
			// else {
			// //await sql.connect('Server=skillnet.database.windows.net,1433;Database=eCitySchoolTownSN_V5_nl_2019-02-19T20-54Z_2019-02-22T12-42Z;User Id=skillnet;Password=N0rdl0g1c;Encrypt=true')
			// await sql.connect('Server=skillnet.database.windows.net,1433;Database=mjgdb;User Id=skillnet;Password=N0rdl0g1c;Encrypt=true')
			// _db = sql
			// //select * from [dbo].[V_Z_PARTNERINFO]
			// //const result = await _mssql.query`SELECT PartnerID, PartnerName FROM V_Z_PARTNERINFO WHERE PartnerID=448`
			// //V_Z_GROUPSKILLS
			// //const result = await sql.query`SELECT name, collation_name FROM sys.databases`
			// //console.dir(result)
			// }



// import fs from 'fs';
// import { isAsyncFunction } from 'util/types';
// import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
// const googleProjectId = process.env.GOOGLE_CLOUD_PROJECT;
// const isInGAE = googleProjectId !== undefined;
// const isLocalUsingCloudProxy = process.env.USE_CLOUD_SQL_AUTH_PROXY !== undefined;



// function mysql_query (db, sql, callback) {

// 	db.query(sql, function(err, result){
// 		if (err) {
// 			console.log("query errored", err)
// 			throw err;
// 		}

// 		// console.log("success", result);
// 		return callback(result)
		
// 	})
// }


		// async function mysql_query (db, sql) {
		// 	var q_res = []

		// 	function setValue(value) {
		// 		q_res = value;
		// 		//console.log(someVar);
		// 	}

		// 	await db.query(sql, function (err, result, fields){
		// 		if (err) {
		// 			console.log("query errored", err)
		// 			throw err;
		// 		}
		// 		else{
		// 			console.log("success");
		// 			setValue(result)
				
		// 		}	
		// 	console.log("worked", q_res)
		// 	return q_res
				
		// 	})
		// }



// export const initDB = () => {
// 	(async () => {
// 		if (_db) {
// 			console.warn("Trying to init DB again!");
// 			return callback(null, _db);
// 		}
// 		sqlite3.verbose()
// 		// _db = new sqlite3.Database(
// 		// 	'./mjg.db',
// 		// 	sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
// 		// 	() => {
// 		// 		console.log('cb')
// 		// 		console.log(_db)
// 		// 	}
// 		// )
// 		_db = await open({
// 			filename: './database/mjg.db',
// 			//filename: '/dbfiles/mjg.db',
// 			mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
// 			driver: sqlite3.Database,
// //			pragmas: [
// //				('journal_mode', 'wal'),
// //				('foreign_keys', 1)
// //			]
// 		})
// 		//console.log(_db.configure)
// 		var rc
// 		rc = await _db.run('PRAGMA foreign_keys = true')
// 		// try{
// 		// 	rc = await _db.run('PRAGMA journal_mode=wal')
// 		// 	console.log('rc: ',rc)
// 		// }
// 		// catch(e) {
// 		// 	console.log('wal: ',e.toString())
// 		// }

// 		//zzz_db.configure('trace', ()=> {console.log('trace')})
// 		//zzz_db.configure('profile', ()=> {console.log('profile')})

// 		// _db.on('trace', function (item) {
// 		// 	console.log('TRACE: ', item);
// 		// });
// 		// _db.on('profile', function (item) {
// 		// 	console.log('PROFILE: ', item);
// 		// });

// 		// _db.on("error", function(error) {
// 		// 	console.log("Getting an error : ", error);
// 		// }); 

// 		//console.log(_db.config)
// 	})()
// }

    //sqlite3.verbose()
    // db = await open({
    //   filename: './mjg.db',
    //   mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    //   driver: sqlite3.Database
    // })
		// console.log(db.config)


		//db.createFunction("JSONVAL", 2, smDbFunctions.jsonval);
    //db.run("CREATE TABLE artists (name TEXT)");
    //db.run("drop TABLE artists");
    //console.log(db)




// export const getTransaction2 = async(db) => {
// 	var transaction
// 	if (process.which === 'sqlite') {
// 		await db.run('BEGIN TRANSACTION')
// 	}
// 	else {
// 		transaction = new db.Transaction();
// 		await transaction.begin();
// 		//return transaction
// 	}
// 	return transaction
// }

// export const getDBandTransaction = async(res,req) => {
// 	if (_db === undefined) {
// 		res.json(getFail(req,'APP_ERROR',2,'database is not defined')) 
// 	}
// 	var transaction = await getTransaction()
// 	return [_db, transaction]
// }


// const createUnixSocketPool = async () => {
// 	const projectstr = "projects/210321194396/secrets/"
// 	const verStr = "/versions/latest"
// 	const test = await accessSecretVersion(projectstr + "test" + verStr)
// 	console.log("helllooooo", test)
// 	console.log("is it working?", await accessSecretVersion(projectstr + "test"  + verStr))
// 	return mysql.createPool({
// 		user: await accessSecretVersion(projectstr + "DB_USER"  + verStr),
// 		password: await accessSecretVersion(projectstr + "DB_PASS"  + verStr),
// 		database: await accessSecretVersion(projectstr + "DB_NAME"  + verStr),
// 		//connectionLimit : 100,
// 		socketPath: await accessSecretVersion(projectstr + "CLOUD_SQL_CONNECTION_NAME"  + verStr)
// 		//host: "cloudsql",
// 		//port: 3306

// 	})
// };

// async function accessSecretVersion(name) {
// 	const client = new SecretManagerServiceClient();
// 	console.log("in access")
// 	try{
// 		const version = await client.accessSecretVersion({
// 			name: name,
// 			});
// 	}
// 	catch (err) {
// 		console.log("access err", err)
// 		// ... error checks
// 	}
// 	console.log("returning payload")
// 	// Extract the payload as a string.
// 	return version.payload.data.toString();
//   }
