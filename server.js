import express from 'express';
import 'dotenv/config';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { loggerutil, corsutil, headerutil } from './serverutil.js';
import { initDatabase, initDBMSsql, getDB, getMSsql, getTransaction, commit, rollback, run, all, getSuccess, getFail, getQuery, getParam, getBody, setColumn } from './db.js';
import equipmentRoutes from './equipmentRoutes.js';

process.which = 'sqlite';
await initDatabase();

const app = express();
app.use(loggerutil);
app.use(corsutil);
app.use(headerutil);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));

app.use('/equipment',equipmentRoutes)

app.get("/", async (req, res) => {
	res.sendFile(path.resolve(process.env.STATIC_DIR + "/index.html"));
});

if (true) {
	var key = fs.readFileSync('./keyslocal/localhost.key')
	var cert = fs.readFileSync('./keyslocal/localhost.crt')
	var options = {key: key, cert: cert};
	var server = https.createServer(options, app);
	server.listen(process.env.PORT,() => {
		console.log(`Running HTTPS on PORT ${process.env.PORT}`);
	})
}
else {
	app.listen(process.env.PORT,() => {
		console.log(`Running HTTP on PORT ${process.env.PORT}`);
	})
}