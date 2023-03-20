import express from 'express';
import 'dotenv/config';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
	res.sendFile(path.resolve(process.env.STATIC_DIR + "/index.html"));
});

app.listen(process.env.PORT,() => {
	console.log(`Running HTTP on PORT ${process.env.PORT}`);
})
