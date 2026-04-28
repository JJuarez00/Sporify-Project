// All application routes

/* Crypto is used for generating random:
   - session IDs
   - OAuth state parameters
*/
const crypto = require('crypto');
const spotify = require('../services/spotify.js');

// Parses a specific cookie value from the request header by name
function getCookie(req, name) {
	let cookies = req.headers.cookie || '';
	let match = cookies.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
	return match ? decodeURIComponent(match[1]) : null;
}

// Looks up the session object for the current request using the session cookie
function getSession(sessions, req) {
	let sessionId = getCookie(req, 'session');
	if (!sessionId) return null;
	return sessions[sessionId] || null;
}

// Returns the database user record for the logged-in session, or null if not authenticated
function getLoggedInUser(db, sessions, req) {
	let session = getSession(sessions, req);
	if (!session) return null;
	return db.prepare('SELECT * FROM users WHERE spotifyId = ?').get(session.spotifyId) || null;
}

// Gets top items and refreshes the access token if it expired, then tries again
async function getTopItemsWithRefresh(db, user, type, timeRange, limit) {
	let data = await spotify.getUserTopItems(user.accessToken, type, timeRange, limit);

	if (data.error && data.error.status === 401 && user.refreshToken) {
		let newTokens = await spotify.refreshAccessToken(user.refreshToken);

		if (newTokens.access_token) {
			let refreshToken = newTokens.refresh_token || user.refreshToken;
			db.prepare('UPDATE users SET accessToken = ?, refreshToken = ? WHERE spotifyId = ?')
				.run(newTokens.access_token, refreshToken, user.spotifyId);

			data = await spotify.getUserTopItems(newTokens.access_token, type, timeRange, limit);
		}
	}

	return data;
}

// Fetches preview clips for all tracks in parallel using Promise.all
async function addTrackPreviews(data) {
	if (!data.items) return data;

	data.items = await Promise.all(
		data.items.map(async function(track) {
			track.preview_url = null;
			if (track.name && track.artists && track.artists.length > 0) {
				track.preview_url = await spotify.findTrackPreview(track.name, track.artists[0].name);
			}
			return track;
		})
	);

	return data;
}

// module.exports exposes registerRoutes so server.js can require this file
module.exports = function registerRoutes(app, db, sessions) {

	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

	// Auth Routes
	app.get('/login', function(req, res) {
		let state = crypto.randomBytes(16).toString('hex');
		res.setHeader('Set-Cookie', 'spotify_oauth_state=' + state + '; HttpOnly; Path=/; Max-Age=600; SameSite=Lax');
		res.redirect(spotify.getAuthUrl(state));
	});

	app.get('/callback', async function(req, res) {
		let code = req.query.code;
		let returnedState = req.query.state;
		let storedState = getCookie(req, 'spotify_oauth_state');
		let clearStateCookie = 'spotify_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';

		if (!code || !returnedState || !storedState || returnedState !== storedState) {
			res.setHeader('Set-Cookie', clearStateCookie);
			return res.redirect('/?error=login_failed');
		}

		try {
			let tokenData = await spotify.exchangeCodeForTokens(code);
			if (tokenData.error) {
				res.setHeader('Set-Cookie', clearStateCookie);
				return res.redirect('/?error=token_failed');
			}

			let profile = await spotify.getUserProfile(tokenData.access_token);
			let profileImg = (profile.images && profile.images.length > 0) ? profile.images[0].url : '';

			// Inserts the user on first login, or updates their info if they already exist.
			// COALESCE keeps the existing refresh token if Spotify didn't send a new one.
			db.prepare(`
				INSERT INTO users (spotifyId, displayName, profileImage, accessToken, refreshToken)
				VALUES (?, ?, ?, ?, ?)
				ON CONFLICT(spotifyId) DO UPDATE SET
					displayName = excluded.displayName,
					profileImage = excluded.profileImage,
					accessToken = excluded.accessToken,
					refreshToken = COALESCE(excluded.refreshToken, users.refreshToken)
			`).run(profile.id, profile.display_name, profileImg, tokenData.access_token, tokenData.refresh_token);

			let sessionId = crypto.randomBytes(32).toString('hex');
			sessions[sessionId] = { spotifyId: profile.id };
			res.setHeader('Set-Cookie', [
				'session=' + sessionId + '; HttpOnly; Path=/; SameSite=Lax',
				clearStateCookie
			]);
			res.redirect('/dashboard.html');

		} catch (error) {
			console.log('OAuth error:', error);
			res.setHeader('Set-Cookie', clearStateCookie);
			res.redirect('/?error=server_error');
		}
	});

	// Clears the session cookie without deleting the user record
	app.post('/logout', function(req, res) {
		let sessionId = getCookie(req, 'session');
		if (sessionId) delete sessions[sessionId];
		res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
		res.json({ message: 'Logged out' });
	});


	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */


	// Public API Routes (no login needed)

	app.get('/api/search', async function(req, res) {
		let query = req.query.q;
		if (!query) return res.status(400).json({ error: 'Search query is required' });

		try {
			let data = await spotify.searchArtists(query);
			res.json(data);
		} catch (error) {
			res.status(500).json({ error: 'Failed to search Spotify' });
		}
	});

	app.get('/api/artist/:id', async function(req, res) {
		try {
			let data = await spotify.getArtistWithTopTracks(req.params.id);
			res.json(data);
		} catch (error) {
			res.status(500).json({ error: 'Failed to fetch artist data' });
		}
	});


	/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */


	// User API Routes (login required)

	app.get('/api/check-session', function(req, res) {
		let user = getLoggedInUser(db, sessions, req);
		if (!user) return res.json({ loggedIn: false });
		res.json({
			loggedIn: true,
			displayName: user.displayName,
			profileImage: user.profileImage
		});
	});

	app.get('/api/me', function(req, res) {
		let user = getLoggedInUser(db, sessions, req);
		if (!user) return res.status(401).json({ error: 'Not logged in' });
		res.json({ displayName: user.displayName, profileImage: user.profileImage });
	});

	app.get('/api/top-tracks', async function(req, res) {
		let user = getLoggedInUser(db, sessions, req);
		if (!user) return res.status(401).json({ error: 'Not logged in' });

		let timeRange = req.query.time_range || 'short_term';
		let limit = req.query.limit || 5;

		try {
			let data = await getTopItemsWithRefresh(db, user, 'tracks', timeRange, limit);
			data = await addTrackPreviews(data);
			res.json(data);
		} catch (error) {
			res.status(500).json({ error: 'Failed to fetch top tracks' });
		}
	});

	app.get('/api/top-artists', async function(req, res) {
		let user = getLoggedInUser(db, sessions, req);
		if (!user) return res.status(401).json({ error: 'Not logged in' });

		let timeRange = req.query.time_range || 'short_term';
		let limit = req.query.limit || 5;

		try {
			let data = await getTopItemsWithRefresh(db, user, 'artists', timeRange, limit);
			res.json(data);
		} catch (error) {
			res.status(500).json({ error: 'Failed to fetch top artists' });
		}
	});
};
