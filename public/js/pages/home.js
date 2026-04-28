// home.js
// Home page script

// Check login status and set up nav accordingly
async function checkLoginStatus() {
	try {
		let response = await fetch('/api/check-session');
		let data = await response.json();

		if (data.loggedIn) {
			// Show dashboard link, profile, and sign out
			document.getElementById('dashboardLink').style.display = 'inline';
			document.getElementById('mobileDashboardLink').style.display = 'inline';
			document.getElementById('navUser').style.display = 'flex';
			document.getElementById('mobileNavUser').style.display = 'flex';
			document.getElementById('navProfilePic').src = data.profileImage || '';
			document.getElementById('mobileNavProfilePic').src = data.profileImage || '';
			document.getElementById('navDisplayName').textContent = data.displayName;
			document.getElementById('mobileNavDisplayName').textContent = data.displayName;

			// Set up sign out button
			document.getElementById('logoutBtn').addEventListener('click', async function() {
				await fetch('/logout', { method: 'POST' });
				window.location.href = '/';
			});
			document.getElementById('mobileLogoutBtn').addEventListener('click', async function() {
				await fetch('/logout', { method: 'POST' });
				window.location.href = '/';
			});
		} else {
			// Not logged in, show the login button
			document.getElementById('navLoginBtn').style.display = 'inline';
			document.getElementById('mobileNavLoginBtn').style.display = 'inline';
		}
	} catch (error) {
		document.getElementById('navLoginBtn').style.display = 'inline';
		document.getElementById('mobileNavLoginBtn').style.display = 'inline';
	}
}

checkLoginStatus();


// GSAP Animations
// Elements start at opacity 0 (via .anim class) and animate to visible
gsap.to('#mainNav', { opacity: 1, duration: 0.3 });

let heroTl = gsap.timeline();
heroTl
	.to('.home-label', { opacity: 1, y: 0, duration: 0.3 })
	.to('#heroTitle', { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')
	.to('.hero-sub', { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, '-=0.15');

gsap.to('#aboutTitle', { opacity: 1, y: 0, duration: 0.3, delay: 0.6 });
gsap.to('.home-list', { opacity: 1, y: 0, duration: 0.3, delay: 0.75 });
