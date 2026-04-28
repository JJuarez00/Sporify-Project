// Artist.js
// Represents a single artist
// Handles rendering artist cards and detailed modal view

class Artist {
	constructor(data) {
		this.spotifyId = data.spotifyId;
		this.name = data.name;
		this.image = data.image;
	}

	// Card for search results
	createSearchCard() {
		let card = document.createElement('div');
		card.classList.add('artist-card');
		card.dataset.id = this.spotifyId;

		card.innerHTML =
			'<img src="' + (this.image || '') + '" alt="' + this.name + '">' +
			'<div class="artist-info">' +
				'<h3>' + this.name + '</h3>' +
			'</div>';

		return card;
	}

	// Card for dashboard
	createDashboardCard(rank) {
		let card = document.createElement('div');
		card.classList.add('artist-card');
		card.dataset.id = this.spotifyId;

		card.innerHTML =
			'<div class="artist-rank">' + rank + '</div>' +
			'<img src="' + (this.image || '') + '" alt="' + this.name + '">' +
			'<div class="artist-info">' +
				'<h3>' + this.name + '</h3>' +
			'</div>';

		return card;
	}

	// Detailed modal popup content
	createModalContent(topTracks) {
		let container = document.createElement('div');
		container.classList.add('modal-body');

		let searchNote = 'These tracks come from Spotify Search because Spotify removed the artist top-tracks endpoint for dev-mode apps. Audio preview buttons use spotify-preview-finder to look for a playable preview clip.';

		container.innerHTML =
			'<div class="modal-artist-header">' +
				'<img src="' + (this.image || '') + '" alt="' + this.name + '">' +
				'<div>' +
					'<h2>' + this.name + '</h2>' +
				'</div>' +
			'</div>' +
			'<div class="modal-tracks">' +
				'<h3>Track Results</h3>' +
				'<p class="modal-note">' + searchNote + '</p>' +
				'<div class="artist-track-list"></div>' +
			'</div>';

		let trackList = container.querySelector('.artist-track-list');

		if (!topTracks || topTracks.length === 0) {
			trackList.innerHTML = '<p class="empty-state">No tracks found for this artist</p>';
			return container;
		}

		topTracks
			.filter(function(item) { return item.name; })
			.map(function(item, i) {
				let albumImg = (item.album && item.album.images && item.album.images.length > 0)
					? item.album.images[0].url : '';
				let albumName = (item.album && item.album.name) ? item.album.name : '';
				let artists = item.artists
					? item.artists.map(function(a) { return a.name; }).join(', ')
					: '';

				return new Track({
					spotifyId: item.id,
					title: item.name,
					artist: artists,
					albumArt: albumImg,
					previewUrl: item.preview_url || null,
					spotifyUrl: item.external_urls ? item.external_urls.spotify : '',
					duration: item.duration_ms || 0
				}).createArtistRow(i + 1, albumName);
			})
			.forEach(function(el) { trackList.appendChild(el); });

		return container;
	}
}
