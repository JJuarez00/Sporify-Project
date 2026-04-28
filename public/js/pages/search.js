// search.js
// Search page script

// Check login status
async function checkLoginStatus() {
	try {
		let response = await fetch('/api/check-session');
		let data = await response.json();

		if (data.loggedIn) {
			document.getElementById('dashboardLink').style.display = 'inline';
			document.getElementById('mobileDashboardLink').style.display = 'inline';
			document.getElementById('navUser').style.display = 'flex';
			document.getElementById('mobileNavUser').style.display = 'flex';
			document.getElementById('navProfilePic').src = data.profileImage || '';
			document.getElementById('mobileNavProfilePic').src = data.profileImage || '';
			document.getElementById('navDisplayName').textContent = data.displayName;
			document.getElementById('mobileNavDisplayName').textContent = data.displayName;

			document.getElementById('logoutBtn').addEventListener('click', async function() {
				await fetch('/logout', { method: 'POST' });
				window.location.href = '/';
			});
			document.getElementById('mobileLogoutBtn').addEventListener('click', async function() {
				await fetch('/logout', { method: 'POST' });
				window.location.href = '/';
			});
		} else {
			document.getElementById('navLoginBtn').style.display = 'inline';
			document.getElementById('mobileNavLoginBtn').style.display = 'inline';
		}
	} catch (error) {
		document.getElementById('navLoginBtn').style.display = 'inline';
		document.getElementById('mobileNavLoginBtn').style.display = 'inline';
	}
}

checkLoginStatus();


// GSAP page animation
gsap.to('#mainNav', { opacity: 1, duration: 0.3 });
gsap.to('.search-section', { opacity: 1, y: 0, duration: 0.3, delay: 0.2 });


// DOM Elements
let searchInput = document.getElementById('searchInput');
let searchBtn = document.getElementById('searchBtn');
let searchResults = document.getElementById('searchResults');
let artistModal = document.getElementById('artistModal');
let modalBody = document.getElementById('modalBody');
let closeModal = document.getElementById('closeModal');
let message = document.getElementById('message');


// Displays a status message that automatically clears after 3 seconds
function showMessage(text, isError) {
	message.textContent = text;
	message.className = isError ? 'message error' : 'message success';
	setTimeout(function() {
		message.textContent = '';
		message.className = 'message';
	}, 3000);
}

// Replaces a container's content with a spinning loading indicator
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


// Search for artists
async function searchArtists(query) {
	showLoading(searchResults, 'Searching artists...');

	try {
		let response = await fetch('/api/search?q=' + encodeURIComponent(query));
		let data = await response.json();

		if (!data.artists || data.artists.items.length === 0) {
			showMessage('No artists found', true);
			return;
		}

		searchResults.innerHTML = '';

		let cards = data.artists.items
			.filter(function(item) { return item.name; })
			.map(function(item) {
				let artistImage = (item.images && item.images.length > 0) ? item.images[0].url : '';
				let artist = new Artist({
					spotifyId: item.id,
					name: item.name,
					image: artistImage
				});
				let card = artist.createSearchCard();
				card.addEventListener('click', function() {
					openArtistModal(artist.spotifyId);
				});
				return card;
			});

		cards.forEach(function(card) { searchResults.appendChild(card); });

		gsap.from('.artist-card', {
			opacity: 0,
			y: 50,
			scale: 0.95,
			duration: 0.5,
			ease: 'power2.out',
			stagger: { each: 0.1, from: 'start' }
		});

		cards.forEach(function(card) {
			card.addEventListener('mouseenter', function() {
				gsap.to(card, { y: -6, scale: 1.02, duration: 0.2 });
			});
			card.addEventListener('mouseleave', function() {
				gsap.to(card, { y: 0, scale: 1, duration: 0.2 });
			});
		});

	} catch (error) {
		showMessage('Search failed. Please try again.', true);
	}
}


// Open artist modal
async function openArtistModal(artistId) {
	modalBody.innerHTML = '';
	showLoading(modalBody, 'Fetching data...');
	artistModal.style.display = 'flex';

	gsap.from('.modal-content', {
		opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.out'
	});

	try {
		let response = await fetch('/api/artist/' + artistId);
		let data = await response.json();

		let artistImage = '';
		if (data.artist.images && data.artist.images.length > 0) {
			artistImage = data.artist.images[0].url;
		}

		let artist = new Artist({
			spotifyId: data.artist.id,
			name: data.artist.name,
			image: artistImage
		});

		modalBody.innerHTML = '';
		modalBody.appendChild(artist.createModalContent(data.topTracks));

		gsap.from('.artist-track', {
			opacity: 0, x: -40, duration: 0.3,
			ease: 'power2.out', stagger: 0.08, delay: 0.2
		});

	} catch (error) {
		modalBody.innerHTML = '<p class="empty-state">Failed to load artist data</p>';
		showMessage('Failed to load artist data', true);
	}
}


// Close modal
function closeArtistModal() {
	if (window.activeTrackPreview) {
		window.activeTrackPreview.stopPreview();
		window.activeTrackPreview = null;
	}

	artistModal.style.display = 'none';
}

closeModal.addEventListener('click', function() {
	closeArtistModal();
});

artistModal.addEventListener('click', function(e) {
	if (e.target === artistModal) {
		closeArtistModal();
	}
});


// Search listeners
searchBtn.addEventListener('click', function() {
	let query = searchInput.value.trim();
	if (query) searchArtists(query);
});

searchInput.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		let query = searchInput.value.trim();
		if (query) searchArtists(query);
	}
});
