import express from 'express';
import { initDatabase, initDBMSsql, getDB, getMSsql, getTransaction, commit, rollback, run, all, getSuccess, getFail, getQuery, getParam, getBody, setColumn } from './db.js';
//import NodeGeocoder from 'node-geocoder';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' })
import xlsx from 'node-xlsx';
import fs from 'fs';

const router = express.Router();

const create = async (req, res, sql) => {
	(async () => {
		try {
			var db = getDB(res); if (db === undefined) { return };
			await run(db,sql)
			res.json({status: 'ok', data: `table created`});
		}
		catch(e) {
			res.json({status: 'fail', data: e.toString()});
		}
	})()
}

router.post('/create', async (req, res) => {
	create(req, res, 
		`CREATE TABLE equipment (
			equipmentId INTEGER NOT NULL,
			equipmentAccountName varchar(255) NOT NULL,
			equipmentLocationName varchar(255) NOT NULL,
			equipmentAddress1 varchar(255) NOT NULL,
			equipmentState varchar(255) NOT NULL,
			equipmentLatitude varchar(255) NOT NULL,
			equipmentLongitude varchar(255) NOT NULL,
			equipmentServiceType varchar(255) NOT NULL,
			equipmentProductName varchar(255) NOT NULL,
			equipmentFixedOrMoble varchar(255) NOT NULL,
			equipmentOEM varchar(255) NOT NULL,
			equipmentModality varchar(255) NOT NULL,
			equipmentSerialNumber varchar(255) NOT NULL,
			PRIMARY KEY (equipmentId)
		)`
	)
})

router.post('/delete', async (req, res) => {
	try {
		var db = getDB(res); if (db === undefined) { return };
		var sqlDelete = `DELETE FROM equipment`
		var rowDelete = await run(db,sqlDelete)
		// console.log(rowDelete.changes)
		res.json({status: 'ok', data: `user rows deleted`});
	}
	catch(e) {
		console.dir(req.originalUrl + e.toString())
		res.json({status: 'fail', data: req.originalUrl + e.toString()});	}
})

router.post('/drop', async (req, res) => {
	try {
		var db = getDB(res); if (db === undefined) { return };
		var sqlDelete = `DROP TABLE equipment`
		var rowDelete = await run(db,sqlDelete)
		// console.log('changes',rowDelete)
		res.json({status: 'ok', data: `user table dropped`});
	}
	catch(e) {
		console.dir(req.originalUrl + e.toString())
		res.json({status: 'fail', data: req.originalUrl + e.toString()});	}
})

router.post('/get', async (req, res) => {
	try {
		var db = getDB(res); if (db === undefined) { return };
		var sql = `SELECT * FROM equipment`
		var rows = await all(db,sql)
		res.json({status: 'ok', data: rows});
	}
	catch(e) {
		console.dir(req.originalUrl + e.toString())
		res.json({status: 'fail', data: req.originalUrl + e.toString()});
	}
})

router.post('/getunique', async (req, res) => {
	try {
		var db = getDB(res); if (db === undefined) { return };

		var id = 0

		// const options = {
		// 	provider: 'google',
		// 	apiKey: 'AIzaSyDv9gi5-vgfA99lixssMPEKrcTHrQLNKDw',
		// 	formatter: null // 'gpx', 'string', ...
		// };
		// const geocoder = NodeGeocoder(options);

		var objByAddress = []
		var sql = `SELECT equipment.equipmentAddress1, equipment.equipmentState, count(*) AS count FROM equipment GROUP BY equipmentAddress1`
		var rows = await all(db,sql)

		for (var r=0; r < rows.length; r++) {
			id++
			//console.log(rows[r])
			rows[r].addressId = id

			// var address = rows[r].equipmentAddress1 + ', ' + rows[r].equipmentState
			// console.log(address)
			// var o = await latlng(geocoder, address)

			// rows[r].Latitude = o.lat;
			// rows[r].Longitude = o.lng;

			var sqlChildren = `SELECT * FROM equipment WHERE equipmentAddress1 = '${rows[r].equipmentAddress1}'`
			var rowsChildren = await all(db,sqlChildren)
			//console.log(rowsChildren)
			rows[r].children = rowsChildren
			objByAddress.push(rows[r])
		}
		//console.log(objByAddress)



		res.json({status: 'ok', data: objByAddress});
	}
	catch(e) {
		console.dir(req.originalUrl + e.toString())
		res.json({status: 'fail', data: req.originalUrl + e.toString()});
	}
})

const accountLocation = async (s,row) => {
	let stck = []
	let stckVal = []
	var a
	var l
	var which
	for (var i=0;i<s.length;i++) {
		if (s[i] === '(' || s[i] === ')') {
			stck.push(s[i])
			stckVal.push(i)
		}
	}
	if (stck.length === 2) {
		l = s.substr(stckVal[0]+1,stckVal[1]-stckVal[0]-1)
		a = s.substr(0,stckVal[0]-1)
		which = '()'
	}
	else {
		var t = "Imaging- "
		let position = s.search(t);
		if (position !== -1) {
			l = s.substr(position + t.length)
			a = s.substr(0,position + t.length - 2)
			which = 'Imaging- '
		}
		else {
			var t = " - "
			let position = s.search(t);
			if (position !== -1) {
				l = s.substr(position + t.length)
				a = s.substr(0,position + t.length - 3)
				which = ' - '
	
			}
			else {
				console.log('not: ', s,row+1)
			}
		}
	}
	//console.log('which:',which,'s:',s,'a:',a,'l:',l)
	return {s,which,a,l}
}

const latlng = async (geocoder, address) => {
	// const val = await geocoder.geocode(address);
	// return {lat:val[0].latitude,lng:val[0].longitude}
}

async function doUserRow(row, geocoder) {

	var equipmentId = row[0]
	console.log(equipmentId)
	var Account = row[1]
	var equipmentAddress1 = row[2]
	var equipmentState = row[3]
	var result = await accountLocation(Account,row)
	var equipmentAccountName = result.a;
	var equipmentLocationName = result.l;

	// var o = await latlng(geocoder, equipmentAddress1 + ' ' + equipmentState)
	// var equipmentLatitude = o.lat;
	// var equipmentLongitude = o.lng;

	var equipmentLatitude = '1';
	var equipmentLongitude = '1';


	var equipmentServiceType = row[4]
	var equipmentProductName = row[5]
	var equipmentFixedOrMoble = row[6]
	var equipmentOEM = row[7]
	var equipmentModality = row[8]
	var equipmentSerialNumber = row[9]

	var objRow = {
		equipmentAccountName,
		equipmentLocationName,
		equipmentAddress1,
		equipmentState,
		equipmentLatitude,
		equipmentLongitude,
		equipmentServiceType,
		equipmentProductName,
		equipmentFixedOrMoble,
		equipmentOEM,
		equipmentModality,
		equipmentSerialNumber
	}
//	console.log(objRow)

	var sql = 
	`INSERT INTO equipment ( 
equipmentId,
equipmentAccountName,
equipmentLocationName,
equipmentAddress1,
equipmentState,
equipmentLatitude,
equipmentLongitude,
equipmentServiceType,
equipmentProductName,
equipmentFixedOrMoble,
equipmentOEM,
equipmentModality,
equipmentSerialNumber 
) 
VALUES ( 
"${equipmentId}",
"${equipmentAccountName}",
"${equipmentLocationName}",
"${equipmentAddress1}",
"${equipmentState}",
"${equipmentLatitude}",
"${equipmentLongitude}",
"${equipmentServiceType}",
"${equipmentProductName}",
"${equipmentFixedOrMoble}",
"${equipmentOEM}",
"${equipmentModality}",
"${equipmentSerialNumber}"
)`
	return {sql, objRow}
}

export const insertTB = async (db,tb,file,partnerID) => {
	const b = xlsx.parse(file.path,{defval:''});
	const sheet = b.find(sheet => sheet.name === tb);
	var data = sheet.data

	// const options = {
	// 	provider: 'google',
	// 	apiKey: 'AIzaSyDv9gi5-vgfA99lixssMPEKrcTHrQLNKDw',
	// 	formatter: null // 'gpx', 'string', ...
	// };
	// const geocoder = NodeGeocoder(options);

	const geocoder = ''

	var arrRows = []
	for (var r=1; r < data.length-1; r++) {
	//for (var r=1; r < 5; r++) {
			var row = data[r]
		if (Number.isInteger(data[r][0]) === true) {
			var o = await doUserRow(row, geocoder)
			arrRows.push(o.objRow)
			//console.log(o.sql)
			//console.log(o.objRow)
			await run(db,o.sql);
		}
	}
	//console.log(arrRows)
	// const unique = [...new Set(arrRows.map(item => {
	// 	console.log(item)
	// 	return item.equipmentAddress1
	// }))];
	//console.log(arrRows)
	//console.log(unique)
	return arrRows
}

router.post('/upload', upload.single('fileName'), async (req, res) => {
	try {
		var db = getDB(res); if (db === undefined) { return };
		try {
			var allData = await insertTB(db,'equipment',req.file)
			fs.unlink(req.file.path, (err) => {
				if (err) {console.log(err)}
				else {console.log("delete file success");}
			});
			res.json({status: 'ok', reason: 'data inserted from ' + req.file.originalname, data: allData})
		}
		catch(e) {
			console.log(e.toString())
			res.json({status: 'fail', reason: 'upload: ' + e.toString()});
		}
	}
	catch(e) {
		console.dir(req.originalUrl + e.toString())
		res.json({status: 'fail', data: req.originalUrl + e.toString()});
	}
})

router.post('/update', async (req, res) => {
	/// mjg DoTo
	try {
		var db = getDB(res); if (db === undefined) { return };
		let partnerID = getBody('partnerID',req);
		let partnerName = getBody('partnerName',req);
		let partnerTitle = getBody('partnerTitle',req);
		let partnerSubTitle = getBody('partnerSubTitle',req);
		var sql = `
		UPDATE partners
		SET
		partnerName='${partnerName}',
		partnerTitle='${partnerTitle}',
		partnerSubTitle='${partnerSubTitle}'
		WHERE
		partnerID=${partnerID}
		`
		var row = await run(db,sql)
		if (row.changes !== 1) {
			res.json({status: 'fail', data: `something went wrong with update of partner: ${partnerName}`});
			return
		}
		res.json({status: 'ok', data: `partner - partnerName:'${partnerName}' updated`});
	}
	catch(e) {
		console.dir(req.originalUrl + e.toString())
		res.json({status: 'fail', data: req.originalUrl + e.toString()});
	}
})

router.post('/all', async (req, res) => {
	var db = getDB(res,req); if (db === undefined) return;
	var sql = `SELECT * FROM equipment`
	var rows = await all(db,sql)
	res.json(getSuccess(req,rows))
})

export default router;