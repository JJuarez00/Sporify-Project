// theme.js
// Shared light/dark mode button for every page

let savedTheme = localStorage.getItem('dawnfmTheme') || 'dark';
let themeToggle = document.getElementById('themeToggle');

function setTheme(themeName) {
	if (themeName === 'light') {
		document.body.classList.add('light-mode');
		if (themeToggle) themeToggle.textContent = '☀';
	} else {
		document.body.classList.remove('light-mode');
		if (themeToggle) themeToggle.textContent = '☾';
	}

	localStorage.setItem('dawnfmTheme', themeName);
}

setTheme(savedTheme);

if (themeToggle) {
	themeToggle.addEventListener('click', function() {
		let nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
		setTheme(nextTheme);

		gsap.fromTo(themeToggle,
			{ rotate: -20, scale: 0.9 },
			{ rotate: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
		);

		window.dispatchEvent(new Event('themeChanged'));
	});
}
