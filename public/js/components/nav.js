// nav.js
// Shared navbar for all pages

let navMount = document.getElementById('navMount');

if (navMount) {
	let activePage = navMount.dataset.active;

	function activeClass(pageName) {
		return activePage === pageName ? ' class="active"' : '';
	}

	let dashboardStyle = activePage === 'dashboard' ? '' : ' style="display: none;"';

	navMount.innerHTML =
		'<nav id="mainNav" class="navbar anim">' +
			'<a href="/" class="logo">dawnFM*</a>' +
			'<button id="menuToggle" class="menu-toggle" type="button" aria-label="Open menu">' +
				'<span class="menu-line"></span>' +
				'<span class="menu-line"></span>' +
				'<span class="menu-line"></span>' +
			'</button>' +
			'<div class="desktop-menu">' +
				'<div class="nav-links">' +
						'<a href="/"' + activeClass('home') + '>Home</a>' +
						'<a href="/search.html"' + activeClass('search') + '>Search</a>' +
						'<a href="/dashboard.html" id="dashboardLink"' + activeClass('dashboard') + dashboardStyle + '>Dashboard</a>' +
						'<a href="/documentation.html"' + activeClass('documentation') + '>Docs</a>' +
					'</div>' +
				'<div class="nav-right">' +
					'<a href="/login" id="navLoginBtn" class="nav-login" style="display: none;">Link Spotify</a>' +
					'<div class="nav-user" id="navUser" style="display: none;">' +
						'<button id="logoutBtn" class="btn-logout">Sign Out</button>' +
						'<img id="navProfilePic" class="nav-profile-pic" src="" alt="Profile">' +
						'<span id="navDisplayName"></span>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</nav>' +
		'<div id="mobileMenu" class="mobile-menu">' +
			'<a href="/" class="menu-logo">dawnFM*</a>' +
			'<div class="nav-links">' +
					'<a href="/"' + activeClass('home') + '>Home</a>' +
					'<a href="/search.html"' + activeClass('search') + '>Search</a>' +
					'<a href="/dashboard.html" id="mobileDashboardLink"' + activeClass('dashboard') + dashboardStyle + '>Dashboard</a>' +
					'<a href="/documentation.html"' + activeClass('documentation') + '>Docs</a>' +
				'</div>' +
			'<div class="nav-right">' +
				'<a href="/login" id="mobileNavLoginBtn" class="nav-login" style="display: none;">Link Spotify</a>' +
				'<div class="nav-user" id="mobileNavUser" style="display: none;">' +
					'<button id="mobileLogoutBtn" class="btn-logout">Sign Out</button>' +
					'<div class="mobile-user-info">' +
						'<img id="mobileNavProfilePic" class="nav-profile-pic" src="" alt="Profile">' +
						'<span id="mobileNavDisplayName"></span>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>';

	document.getElementById('menuToggle').addEventListener('click', function() {
		let mobileMenu = document.getElementById('mobileMenu');
		let menuIsOpen = !mobileMenu.classList.contains('open');
		let lines = this.querySelectorAll('.menu-line');
		this.setAttribute('aria-label', menuIsOpen ? 'Close menu' : 'Open menu');

		if (menuIsOpen) {
			mobileMenu.classList.add('open');
			gsap.to(lines[0], { y: 7, rotation: 45, duration: 0.22, ease: 'power2.out' });
			gsap.to(lines[1], { opacity: 0, duration: 0.16, ease: 'power2.out' });
			gsap.to(lines[2], { y: -7, rotation: -45, duration: 0.22, ease: 'power2.out' });
			gsap.fromTo(mobileMenu,
				{ opacity: 0 },
				{ opacity: 1, duration: 0.25, ease: 'power2.out' }
			);
			gsap.from('.mobile-menu a, .mobile-menu .nav-user', {
				opacity: 0,
				y: 18,
				duration: 0.25,
				stagger: 0.05,
				ease: 'power2.out'
			});
		} else {
			gsap.to(lines[0], { y: 0, rotation: 0, duration: 0.2, ease: 'power2.inOut' });
			gsap.to(lines[1], { opacity: 1, duration: 0.16, delay: 0.04, ease: 'power2.out' });
			gsap.to(lines[2], { y: 0, rotation: 0, duration: 0.2, ease: 'power2.inOut' });
			gsap.to(mobileMenu, {
				opacity: 0,
				duration: 0.2,
				ease: 'power2.in',
				onComplete: function() {
					mobileMenu.classList.remove('open');
				}
			});
		}
	});
}
