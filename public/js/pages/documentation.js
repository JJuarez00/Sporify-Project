// documentation.js
// Documentation page script

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

gsap.to('#mainNav', { opacity: 1, duration: 0.3 });
