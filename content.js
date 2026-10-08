(() => {
	"use strict";

	console.log("[Query Filter] SCRIPT LOADED");

	let negativeTerms = [];
	let positiveTerms = [];

	function getSearchQuery() {
		const params = new URLSearchParams(window.location.search);
		return params.get("search_query") || "";
	}

	function extractNegativeTerms(query) {
		const terms = [];

		const regex = /(?:^|\s)-(?:"([^"]+)"|'([^']+)'|(\S+))/g;

		let match;

		while ((match = regex.exec(query)) !== null) {
			const term = (match[1] || match[2] || match[3]).trim().toLowerCase();

			if (term) {
				terms.push(term);
			}
		}

		return terms;
	}

	function extractPositiveTerms(query) {
		const terms = [];

		const regex = /"([^"]+)"/g;

		let match;

		while ((match = regex.exec(query)) !== null) {
			const term = match[1].trim().toLowerCase();

			if (term) {
				terms.push(term);
			}
		}

		return terms;
	}

	function setFilters() {
		const query = getSearchQuery();

		negativeTerms = extractNegativeTerms(query);
		positiveTerms = extractPositiveTerms(query);

		console.log("[Query Filter] Search query:", query);
		console.log("[Query Filter] Negative terms:", negativeTerms);
		console.log("[Query Filter] Positive terms:", positiveTerms);
	}

	function getVideoTitle(result) {
		const titleElement = result.querySelector(
			"ytd-video-renderer yt-formatted-string",
		);

		if (!titleElement) {
			return "";
		}

		const ariaLabel = titleElement.getAttribute("aria-label");

		if (ariaLabel) {
			return ariaLabel
				.replace(/\s+\d+\s+(seconds?|minutes?|hours?)$/i, "")
				.trim()
				.toLowerCase();
		}

		return (titleElement.textContent || "").trim().toLowerCase();
	}

	function matchesNegativeTerm(title) {
		return negativeTerms.some((term) => title.includes(term));
	}

	function matchesPositiveTerms(title) {
		if (positiveTerms.length === 0) {
			return false;
		}

		return positiveTerms.every((term) => title.includes(term));
	}

	// Reset previous filter styling when a new search is performed
	function resetVideoStyle(video) {
		video.style.removeProperty("background-color");
		video.style.removeProperty("border");
		video.style.removeProperty("box-shadow");

		video.removeAttribute("data-negative-filter-match");
		video.removeAttribute("data-positive-filter-match");
	}

	// ------------------------------------------------------------
	// Process every YouTube search result
	// ------------------------------------------------------------

	function filterVideos() {
		const results = document.querySelectorAll(
			"ytd-item-section-renderer ytd-video-renderer",
		);

		console.log("[Query Filter] Found video results:", results.length);

		for (const video of results) {
			const title = getVideoTitle(video);

			if (!title) {
				continue;
			}

			resetVideoStyle(video);
			const negativeMatch = matchesNegativeTerm(title);
			const positiveMatch = matchesPositiveTerms(title);

			// ------------------------------------------------------
			// DEBUG MODE
			//
			// DO NOT REMOVE THE VIDEO.
			// Make the entire video component bright red.
			// ------------------------------------------------------

			if (negativeMatch) {
				video.style.setProperty("background-color", "#ff0000", "important");

				video.style.setProperty("border", "6px solid #ff0000", "important");

				video.style.setProperty("box-shadow", "0 0 25px #ff0000", "important");

				video.setAttribute("data-negative-filter-match", "true");

				console.log("[Query Filter] NEGATIVE MATCH:", title);
				continue;
			}

			// BLUE = inclusion term(s) found
			if (positiveMatch) {
				video.style.setProperty("background-color", "#008fc8", "important");

				video.style.setProperty("border", "6px solid #008fc8", "important");

				video.style.setProperty("box-shadow", "0 0 25px #008fc8", "important");

				video.setAttribute("data-positive-filter-match", "true");

				console.log("[Query Filter] POSITIVE MATCH:", title);
			}
		}
	}

	// ------------------------------------------------------------
	// Watch for new videos being added
	// ------------------------------------------------------------

	const observer = new MutationObserver(() => {
		filterVideos();
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// ------------------------------------------------------------
	// Detect URL changes.
	// ------------------------------------------------------------

	let lastUrl = location.href;

	setInterval(() => {
		if (location.href !== lastUrl) {
			lastUrl = location.href;

			console.log("[Query Filter] Search changed");

			setFilters();

			// Wait briefly for YouTube to construct
			// the new result components.
			setTimeout(filterVideos, 500);
		}
	}, 500);

	// ------------------------------------------------------------
	// Initial execution
	// ------------------------------------------------------------

	setFilters();

	setTimeout(filterVideos, 1000);
})();
