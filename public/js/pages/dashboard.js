// dashboard.js
// Dashboard page script
// Loads user data, displays top tracks/artists, and exports a PDF

// DOM Elements
let dashboardSection = document.getElementById('dashboard');
let notLoggedIn = document.getElementById('notLoggedIn');
let dashboardLoading = document.getElementById('dashboardLoading');
let navProfilePic = document.getElementById('navProfilePic');
let navDisplayName = document.getElementById('navDisplayName');
let navUser = document.getElementById('navUser');
let topTracksContainer = document.getElementById('topTracks');
let topArtistsContainer = document.getElementById('topArtists');
let message = document.getElementById('message');

let currentTracks = [];


function showMessage(text, isError) {
	message.textContent = text;
	message.className = isError ? 'message error' : 'message success';
	setTimeout(function() {
		message.textContent = '';
		message.className = 'message';
	}, 3000);
}

function showLoading(container, text) {
	container.innerHTML =
		'<div class="loading-state">' +
			'<div class="loading-circle"></div>' +
			'<p>' + text + '</p>' +
		'</div>';

	gsap.to(container.querySelector('.loading-circle'), {
		rotation: 360,
		duration: 0.9,
		repeat: -1,
		ease: 'none'
	});
}

function startPageLoading() {
	dashboardLoading.style.display = 'block';
	gsap.to('#mainNav', { opacity: 1, duration: 0.3 });
	gsap.fromTo('#dashboardLoading',
		{ opacity: 0, y: 18 },
		{ opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
	);
	gsap.to('#dashboardLoading .loading-circle', {
		rotation: 360,
		duration: 0.9,
		repeat: -1,
		ease: 'none'
	});
}

function stopPageLoading() {
	gsap.killTweensOf('#dashboardLoading .loading-circle');
	dashboardLoading.style.display = 'none';
}


// Check if user is logged in and load their data
async function initDashboard() {
	try {
		let response = await fetch('/api/check-session');
		let data = await response.json();

		if (!data.loggedIn) {
			notLoggedIn.style.display = 'block';
			dashboardSection.style.display = 'none';
			gsap.to('#mainNav', { opacity: 1, duration: 0.3 });
			gsap.from('#notLoggedIn', { opacity: 0, y: 30, duration: 0.5 });
			return;
		}

		// Set nav profile info
		navProfilePic.src = data.profileImage || '';
		document.getElementById('mobileNavProfilePic').src = data.profileImage || '';
		navDisplayName.textContent = data.displayName;
		document.getElementById('mobileNavDisplayName').textContent = data.displayName;
		navUser.style.display = 'flex';
		document.getElementById('mobileNavUser').style.display = 'flex';

		notLoggedIn.style.display = 'none';
		startPageLoading();

		// Load data before showing anything
		await Promise.all([
			loadSelectedTracks(),
			loadSelectedArtists()
		]);

		// Reveal dashboard after data loads (prevents flash)
		stopPageLoading();
		dashboardSection.style.visibility = 'visible';
		animateDashboard();

	} catch (error) {
		stopPageLoading();
		notLoggedIn.style.display = 'block';
		dashboardSection.style.display = 'none';
		gsap.to('#mainNav', { opacity: 1, duration: 0.3 });
	}
}


// Load top tracks
async function loadTopTracks(timeRange, limit) {
	currentTracks.forEach(function(track) { track.stopPreview(); });
	currentTracks = [];
	showLoading(topTracksContainer, 'Fetching data...');

	try {
		let response = await fetch('/api/top-tracks?time_range=' + timeRange + '&limit=' + limit);
		let data = await response.json();

		if (!data.items || data.items.length === 0) {
			topTracksContainer.innerHTML = '<p class="empty-state">No tracks found for this time period</p>';
			return;
		}

		topTracksContainer.innerHTML = '';

		currentTracks = data.items
			.filter(function(item) { return item.name && item.artists; })
			.map(function(item, index) {
				let albumImg = (item.album && item.album.images && item.album.images.length > 0)
					? item.album.images[0].url : '';

				let track = new Track({
					spotifyId: item.id,
					title: item.name,
					artist: item.artists.map(function(a) { return a.name; }).join(', '),
					albumArt: albumImg,
					previewUrl: item.preview_url || null,
					spotifyUrl: item.external_urls ? item.external_urls.spotify : '',
					duration: item.duration_ms || 0
				});

				topTracksContainer.appendChild(track.createCard(index + 1));
				return track;
			});

		gsap.from('.track-card', {
			opacity: 0, x: -60, duration: 0.4,
			ease: 'power2.out', stagger: 0.12
		});

	} catch (error) {
		showMessage('Failed to load top tracks', true);
	}
}


// Load top artists
async function loadTopArtists(timeRange, limit) {
	showLoading(topArtistsContainer, 'Loading artists...');

	try {
		let response = await fetch('/api/top-artists?time_range=' + timeRange + '&limit=' + limit);
		let data = await response.json();

		if (!data.items || data.items.length === 0) {
			topArtistsContainer.innerHTML = '<p class="empty-state">No artists found for this time period</p>';
			return;
		}

		topArtistsContainer.innerHTML = '';

		let artistCards = data.items
			.filter(function(item) { return item.name; })
			.map(function(item, index) {
				let artistImg = (item.images && item.images.length > 0) ? item.images[0].url : '';
				let artist = new Artist({
					spotifyId: item.id,
					name: item.name,
					image: artistImg
				});
				return artist.createDashboardCard(index + 1);
			});

		artistCards.forEach(function(card) { topArtistsContainer.appendChild(card); });

		gsap.from('.artist-card', {
			opacity: 0, y: 50, scale: 0.95,
			duration: 0.5, ease: 'power2.out',
			stagger: { each: 0.1, from: 'start' }
		});

		artistCards.forEach(function(card) {
			card.addEventListener('mouseenter', function() {
				gsap.to(card, { y: -6, scale: 1.02, duration: 0.2 });
			});
			card.addEventListener('mouseleave', function() {
				gsap.to(card, { y: 0, scale: 1, duration: 0.2 });
			});
		});

	} catch (error) {
		showMessage('Failed to load top artists', true);
	}
}


// GSAP dashboard animations
function animateDashboard() {
	gsap.to('#mainNav', { opacity: 1, duration: 0.3 });

	gsap.from('.dashboard-section', {
		opacity: 0, y: 40, duration: 0.5,
		stagger: 0.2, delay: 0.3
	});
}


// Event Listeners

function loadSelectedTracks() {
	let timeRange = document.getElementById('trackTimeRange').value;
	let limit = document.getElementById('trackLimit').value;
	return loadTopTracks(timeRange, limit);
}

function loadSelectedArtists() {
	let timeRange = document.getElementById('artistTimeRange').value;
	let limit = document.getElementById('artistLimit').value;
	return loadTopArtists(timeRange, limit);
}

document.getElementById('trackTimeRange').addEventListener('change', loadSelectedTracks);
document.getElementById('trackLimit').addEventListener('change', loadSelectedTracks);
document.getElementById('artistTimeRange').addEventListener('change', loadSelectedArtists);
document.getElementById('artistLimit').addEventListener('change', loadSelectedArtists);

document.getElementById('logoutBtn').addEventListener('click', async function() {
	try {
		await fetch('/logout', { method: 'POST' });
		window.location.href = '/';
	} catch (error) {
		showMessage('Failed to sign out', true);
	}
});

document.getElementById('mobileLogoutBtn').addEventListener('click', async function() {
	try {
		await fetch('/logout', { method: 'POST' });
		window.location.href = '/';
	} catch (error) {
		showMessage('Failed to sign out', true);
	}
});

document.getElementById('exportPdf').addEventListener('click', function() {
	let jsPDF = window.jspdf.jsPDF;
	let doc = new jsPDF();

	doc.setFontSize(22);
	doc.text('dawnFM* - My Stats', 20, 20);
	doc.setFontSize(12);
	doc.text('Generated: ' + new Date().toLocaleDateString(), 20, 30);
	doc.setLineWidth(0.5);
	doc.line(20, 35, 190, 35);

	doc.setFontSize(16);
	doc.text('Top Tracks', 20, 45);

	// reduce accumulates the Y position as each track row is drawn
	let tracksEndY = currentTracks.reduce(function(y, track, index) {
		if (y > 270) { doc.addPage(); y = 20; }
		doc.setFontSize(12);
		doc.text((index + 1) + '. ' + track.title, 25, y);
		doc.setFontSize(10);
		doc.text('by ' + track.artist, 30, y + 6);
		return y + 14;
	}, 55);

	let artistsStartY = tracksEndY + 10;
	if (artistsStartY > 250) { doc.addPage(); artistsStartY = 20; }
	doc.setFontSize(16);
	doc.text('Top Artists', 20, artistsStartY);

	Array.from(document.querySelectorAll('.artist-card h3')).reduce(function(y, el, index) {
		if (y > 270) { doc.addPage(); y = 20; }
		doc.setFontSize(12);
		doc.text((index + 1) + '. ' + el.textContent, 25, y);
		return y + 10;
	}, artistsStartY + 10);

	doc.save('dawnfm-stats.pdf');
	showMessage('PDF downloaded!');
});

initDashboard();
