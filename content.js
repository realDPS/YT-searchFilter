(() => {
	"use strict";

	console.log("[Query Filter] SCRIPT LOADED");

	let excludedTerms = [];
	let HighlightTerms = [];

	function getSearchQuery() {
		const params = new URLSearchParams(window.location.search);
		return params.get("search_query") || "";
	}

	function extractExcludedTerms(query) {
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

	function extractHighlightTerms(query) {
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

		excludedTerms = extractExcludedTerms(query);
		HighlightTerms = extractHighlightTerms(query);

		console.log("[Query Filter] Search query:", query);
		console.log("[Query Filter] Excluded terms:", excludedTerms);
		console.log("[Query Filter] Highlight terms:", HighlightTerms);
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

	function matchesExcludedTerm(title) {
		return excludedTerms.some((term) => title.includes(term));
	}

	function matchesHighlightTerms(title) {
		if (HighlightTerms.length === 0) {
			return false;
		}

		return HighlightTerms.every((term) => title.includes(term));
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

			const excludedMatch = matchesExcludedTerm(title);
			const highlightMatch = matchesHighlightTerms(title);

			// ------------------------------------------------------
			// HIDE = excluded term found

			if (excludedMatch) {
				video.style.setProperty("display", "none", "important");

				video.setAttribute("data-excluded-filter-match", "true");

				console.log("[Query Filter] HIDDEN:", title);
				continue;
			}

			if (highlightMatch) {
				video.style.setProperty("background-color", "#008fc8", "important");
				video.style.setProperty("border", "6px solid #008fc8", "important");
				video.style.setProperty("box-shadow", "0 0 25px #008fc8", "important");
				video.setAttribute("data-highlight-filter-match", "true");

				console.log("[Query Filter] HIGHLIGHT MATCH:", title);
			}
		}
	}

	// ------------------------------------------------------------
	// Watch for new videos being added
	// ------------------------------------------------------------

	const observer = new MutationObserver(() => {
		clearTimeout(filterTimeout);
		// Debounce the filtering to avoid excessive calls during rapid DOM changes
		filterTimeout = setTimeout(() => {
			filterVideos();
		}, 500);
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// ------------------------------------------------------------
	// Detect URL changes
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
