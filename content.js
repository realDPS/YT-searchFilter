(() => {
	"use strict";

	console.log("[Negative Filter] SCRIPT LOADED");

	let negativeTerms = [];

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

	function setFilters() {
		const query = getSearchQuery();

		negativeTerms = extractNegativeTerms(query);

		console.log("[Negative Filter] Search query:", query);

		console.log("[Negative Filter] Negative terms:", negativeTerms);
	}

	function getVideoTitle(result) {
		const titleElement = result.querySelector(
			"ytd-video-renderer yt-formatted-string",
		);

		if (!titleElement) {
			return "";
		}

		// Prefer aria-label because it contains the complete title
		// in the HTML you provided.
		const ariaLabel = titleElement.getAttribute("aria-label");

		if (ariaLabel) {
			// Remove the duration if YouTube included it.
			return ariaLabel
				.replace(/\s+\d+\s+(seconds?|minutes?|hours?)$/i, "")
				.trim()
				.toLowerCase();
		}

		return (titleElement.textContent || "").trim().toLowerCase();
	}

	/**
	 * Checks if a video title contains any negative terms.
	 * @param {string} title - The video title to check.
	 * @returns {boolean} True if the title contains any negative terms, false otherwise.
	 */
	function matchesNegativeTerm(title) {
		return negativeTerms.some((term) => title.includes(term));
	}

	// ------------------------------------------------------------
	// Process every YouTube search result
	// ------------------------------------------------------------

	function filterVideos() {
		const results = document.querySelectorAll(
			"ytd-item-section-renderer ytd-video-renderer",
		);

		console.log("[Negative Filter] Found video results:", results.length);

		for (const video of results) {
			const title = getVideoTitle(video);

			if (!title) {
				continue;
			}

			const matches = matchesNegativeTerm(title);

			if (matches) {
				// ------------------------------------------------------
				// DEBUG MODE
				//
				// DO NOT REMOVE THE VIDEO.
				// Make the entire video component bright red.
				// ------------------------------------------------------

				video.style.setProperty("background-color", "#ff0000", "important");

				video.style.setProperty("border", "6px solid #ff0000", "important");

				video.style.setProperty("box-shadow", "0 0 25px #ff0000", "important");

				video.setAttribute("data-negative-filter-match", "true");

				console.log("[Negative Filter] MATCH:", title);
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

			console.log("[Negative Filter] Search changed");

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
