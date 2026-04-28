// Handles audio preview playback and rendering track cards

class Track {
	constructor(data) {
		this.id = data.id || null;
		this.spotifyId = data.spotifyId;
		this.title = data.title;
		this.artist = data.artist;
		this.albumArt = data.albumArt;
		this.previewUrl = data.previewUrl;
		this.spotifyUrl = data.spotifyUrl || '';
		this.duration = data.duration || 0;
		this.audio = null;
		this.isPlaying = false;
		this.previewBtn = null;
	}

	// Plays or pauses the 30 second audio preview
	togglePreview() {
		if (!this.previewUrl) return false;

		if (this.isPlaying) {
			this.stopPreview();
		} else {
			// Stop any other track that is currently playing before starting this one
			if (window.activeTrackPreview && window.activeTrackPreview !== this) {
				window.activeTrackPreview.stopPreview();
			}

			if (!this.audio) {
				this.audio = new Audio(this.previewUrl);
				let self = this;
				this.audio.addEventListener('ended', function() {
					self.isPlaying = false;
					self.setPreviewText('Preview');
				});
			}
			this.audio.play();
			this.isPlaying = true;
			window.activeTrackPreview = this;
		}

		return this.isPlaying;
	}

	// Stops the preview and resets to the start
	stopPreview() {
		if (this.audio) {
			this.audio.pause();
			this.audio.currentTime = 0;
			this.isPlaying = false;
			this.setPreviewText('Preview');
		}
	}

	// Updates the preview button label, if a button reference has been set
	setPreviewText(text) {
		if (this.previewBtn) {
			this.previewBtn.textContent = text;
		}
	}

	// Converts milliseconds to readable format like 3:24
	formatDuration() {
		let minutes = Math.floor(this.duration / 60000);
		let seconds = Math.floor((this.duration % 60000) / 1000);
		return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
	}

	// Builds and returns a DOM element for this track
	createCard(rank) {
		let card = document.createElement('div');
		card.classList.add('track-card');

		card.innerHTML =
			'<div class="track-rank">' + rank + '</div>' +
			'<img src="' + (this.albumArt || '') + '" alt="' + this.title + '">' +
			'<div class="track-info">' +
				'<h3>' + this.title + '</h3>' +
				'<p>' + this.artist + '</p>' +
				'<span class="track-duration">' + this.formatDuration() + '</span>' +
			'</div>' +
			'<div class="track-actions">' +
				(this.previewUrl
					? '<button class="btn-preview">Preview</button>'
					: '<button class="btn-preview" disabled>No Preview</button>') +
			'</div>';

		// Wire up the preview button
		let previewBtn = card.querySelector('.btn-preview');
		let self = this;

		if (this.previewUrl) {
			previewBtn.addEventListener('click', function() {
				self.previewBtn = previewBtn;
				let playing = self.togglePreview();
				previewBtn.textContent = playing ? 'Pause' : 'Preview';

				gsap.fromTo(previewBtn,
					{ scale: 0.92 },
					{ scale: 1, duration: 0.2, ease: 'power2.out' }
				);
			});
		}

		return card;
	}

	// Builds a smaller row for the artist popup
	createArtistRow(rank, albumName) {
		let row = document.createElement('div');
		row.classList.add('artist-track');

		row.innerHTML =
			'<span class="artist-track-rank">' + rank + '</span>' +
			'<img src="' + (this.albumArt || '') + '" alt="' + this.title + '">' +
			'<div class="artist-track-info">' +
				'<p class="artist-track-name">' + this.title + '</p>' +
				'<p class="artist-track-album">' + albumName + '</p>' +
			'</div>' +
			'<div class="artist-track-actions">' +
				(this.previewUrl
					? '<button class="btn-preview">Preview</button>'
					: '<button class="btn-preview" disabled>No Preview</button>') +
			'</div>';

		let previewBtn = row.querySelector('.btn-preview');
		let self = this;

		if (this.previewUrl) {
			previewBtn.addEventListener('click', function() {
				self.previewBtn = previewBtn;
				let playing = self.togglePreview();
				previewBtn.textContent = playing ? 'Pause' : 'Preview';

				gsap.fromTo(previewBtn,
					{ scale: 0.92 },
					{ scale: 1, duration: 0.2, ease: 'power2.out' }
				);
			});
		}

		return row;
	}
}
