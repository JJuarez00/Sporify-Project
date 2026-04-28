/* 
This script handles all Spotify API interactions
Public token for catalog searches, user tokens for personal data
*/

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'user-top-read user-read-recently-played user-read-private';
const spotifyPreviewFinder = require('spotify-preview-finder');

// Cached public token (for searches, no login needed)
let publicToken = null;
let tokenExpiry = 0;

// Gets a public access token using Client Credentials flow
// Only allows access to public catalog data like search and artist info
async function getPublicToken() {
	if (publicToken && Date.now() < tokenExpiry) {
		return publicToken;
	}

	let response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
		},
		body: 'grant_type=client_credentials'
	});

	let data = await response.json();

	publicToken = data.access_token;
	tokenExpiry = Date.now() + (data.expires_in * 1000);

	return publicToken;
}


// Exchanges an auth code for access and refresh tokens
// Called during the OAuth callback after the user logs in
async function exchangeCodeForTokens(code) {
	let response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code: code,
			redirect_uri: REDIRECT_URI
		}).toString()
	});

	return await response.json();
}


// Uses the refresh token to get a new access token when the old one expires
async function refreshAccessToken(refreshToken) {
	let response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		}).toString()
	});

	return await response.json();
}


// Fetches the current user's Spotify profile
async function getUserProfile(accessToken) {
	let response = await fetch('https://api.spotify.com/v1/me', {
		headers: { 'Authorization': 'Bearer ' + accessToken }
	});

	return await response.json();
}


// Fetches the user's top tracks or artists
// type = 'tracks' or 'artists'
// timeRange = 'short_term', 'medium_term', or 'long_term'
async function getUserTopItems(accessToken, type, timeRange, limit) {
	let url = 'https://api.spotify.com/v1/me/top/' + type;
	url += '?time_range=' + timeRange + '&limit=' + limit;

	let response = await fetch(url, {
		headers: { 'Authorization': 'Bearer ' + accessToken }
	});

	return await response.json();
}


// Searches the Spotify catalog for artists
async function searchArtists(query) {
	let token = await getPublicToken();
	let response = await fetch(
		'https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=artist',
		{ headers: { 'Authorization': 'Bearer ' + token } }
	);

	return await response.json();
}


// Uses spotify-preview-finder to find preview details
async function findTrackPreviewInfo(trackName, artistName) {
	try {
		let result = await spotifyPreviewFinder(trackName, artistName, 1);

		if (result.success && result.results.length > 0) {
			let song = result.results[0];
			let previewUrls = song.previewUrls || [];
			let previewUrl = null;

			for (let i = 0; i < previewUrls.length; i++) {
				if (previewUrls[i].includes('/mp3-preview/')) {
					previewUrl = previewUrls[i];
					break;
				}
			}

			return {
				previewUrl: previewUrl,
				spotifyUrl: song.spotifyUrl || '',
				trackId: song.trackId || '',
				durationMs: song.durationMs || 0
			};
		}
	} catch (error) {
		return null;
	}

	return null;
}

// Gets just the preview URL for a track, or null if not found
async function findTrackPreview(trackName, artistName) {
	let info = await findTrackPreviewInfo(trackName, artistName);

	return info ? info.previewUrl : null;
}


// Gets an artist's details and their tracks using search
// (artist top tracks is deprecated for dev mode apps, so search is used instead)
// https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
async function getArtistWithTopTracks(artistId) {
	let token = await getPublicToken();

	let artistRes = await fetch('https://api.spotify.com/v1/artists/' + artistId,
		{ headers: { 'Authorization': 'Bearer ' + token } }
	);
	let artist = await artistRes.json();

	// Use search to find tracks by this artist (Spotify returns these by relevance)
	let tracksRes = await fetch(
		'https://api.spotify.com/v1/search?q=artist:' + encodeURIComponent(artist.name) + '&type=track&limit=10',
		{ headers: { 'Authorization': 'Bearer ' + token } }
	);
	let tracksData = await tracksRes.json();

	let rawTracks = (tracksData.tracks && tracksData.tracks.items) ? tracksData.tracks.items : [];

	// Deduplicate by track name using reduce (search can return multiple editions of the same song)
	let seen = new Set();
	let uniqueTracks = rawTracks.reduce(function(acc, track) {
		if (track.name && !seen.has(track.name)) {
			seen.add(track.name);
			acc.push(track);
		}
		return acc;
	}, []);

	// Fetch all preview URLs in parallel instead of one at a time
	let tracks = await Promise.all(
		uniqueTracks
			.filter(function(track) { return track.name && track.artists && track.artists.length > 0; })
			.map(async function(track) {
				track.preview_url = await findTrackPreview(track.name, track.artists[0].name);
				return track;
			})
	);

	return { artist: artist, topTracks: tracks };
}

// Builds the Spotify authorization URL for login
function getAuthUrl(state) {
	let params = new URLSearchParams({
		response_type: 'code',
		client_id: CLIENT_ID,
		scope: SCOPES,
		redirect_uri: REDIRECT_URI,
		state: state
	});
	return 'https://accounts.spotify.com/authorize?' + params.toString();
}


module.exports = {
	getPublicToken,
	exchangeCodeForTokens,
	refreshAccessToken,
	getUserProfile,
	getUserTopItems,
	searchArtists,
	findTrackPreviewInfo,
	findTrackPreview,
	getArtistWithTopTracks,
	getAuthUrl
};
