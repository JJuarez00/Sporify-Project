// Sets up Express, database, sessions, and delegates routes to config/routes.js

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const registerRoutes = require('./config/routes.js');


// -- Express Setup --
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// -- Database Setup --
const db = new Database(path.join(__dirname, 'db', 'dawnfm.db'));

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		spotifyId TEXT UNIQUE,
		displayName TEXT,
		profileImage TEXT,
		accessToken TEXT,
		refreshToken TEXT,
		createdAt TEXT DEFAULT CURRENT_TIMESTAMP
	)
`);


// -- Session Store --
const sessions = {};


// -- Routes --
registerRoutes(app, db, sessions);


// -- Start Server --
app.listen(PORT, function() {
	console.log('dawnFM* server running at http://127.0.0.1:' + PORT);
});
