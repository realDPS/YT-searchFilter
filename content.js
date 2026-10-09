// about:debugging#/runtime/this-firefox
(() => {
	"use strict";

	console.log("CUSTOM QUERY SCRIPT LOADED");

	let excludedTerms = [];
	let includedTerms = [];
	let requiredTerms = [];

	function getUrlQuery() {
		const params = new URLSearchParams(window.location.search);
		return params.get("search_query") || "";
	}
	/**
	 * Extracts excluded terms from a search query. Operator "-" indicates that the term should be excluded from results.
	 * Supports both unquoted and double-quoted terms.
	 * For example, the query: javascript tutorial -shorts -"crash course" would return ["shorts", "crash course"].
	 * @param {string} query - The search query.
	 * @returns {string[]} An array of excluded terms.
	 */
	function extractExcludedTerms(query) {
		const terms = [];

		const regex = /(?:^|\s)-(?:"([^"]+)"|(\S+))/g;

		let match;

		while ((match = regex.exec(query)) !== null) {
			const term = (match[1] || match[2]).trim().toLowerCase();

			if (term) {
				terms.push(term);
			}
		}

		return terms;
	}
	/**
	 * Extracts positive(soft inclusion) terms from a search query. operator "" indicates that the term should be included in results.
	 * For example, the query: javascript tutorial "15 MINS" "typescript" would return ["15 mins", "typescript"].
	 * @param {string} query - The search query.
	 * @returns {string[]} An array of positive terms.
	 */

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

	/**
	 * Extracts required terms from a search query. The "*" operator indicates that a term must be included in the video title.
	 * If a video title does not contain all required terms, it will be filtered out.
	 * Supports both unquoted and double-quoted terms.
	 * For example:
	 *   easy *swedish *recipe = ["swedish", "recipe"]
	 *   *"swedish meatball" =["swedish meatball"]
	 *
	 * The second example will match only if the title contains the exact phrase order "swedish meatball"
	 * @param {string} query - The search query.
	 * @returns {string[]} An array of required terms.
	 */
	function extractRequiredTerms(query) {
		const terms = [];

		const regex = /(?:^|\s)\*(?:"([^"]+)"|(\S+))/g;

		let match;

		while ((match = regex.exec(query)) !== null) {
			const term = (match[1] || match[2]).trim().toLowerCase();

			if (term) {
				terms.push(term);
			}
		}

		return terms;
	}

	function setFilters() {
		const query = getUrlQuery();

		excludedTerms = extractExcludedTerms(query);
		// includedTerms = extractPositiveTerms(query);
		requiredTerms = extractRequiredTerms(query);

		console.log("-----------------------------");
		console.log("Search query:", query);
		console.log("Excluded terms:", excludedTerms);
		console.log("Required terms:", requiredTerms);
		console.log("-----------------------------");
	}

	/**
	 * Gets the title of a video result element
	 * @param {Element} result - The video result element
	 * @returns {string} The video title
	 */
	function getVideoTitle(result) {
		const titleElement = result.querySelector("#video-title");
		return (titleElement?.textContent || "").trim().toLowerCase();
	}

	// ------------------------------------------------------------
	// Matches functions

	function matchesExcludedTerm(title) {
		return excludedTerms.some((term) => title.includes(term));
	}

	function matchesPositiveTerms(title) {
		if (includedTerms.length === 0) {
			return false;
		}

		return includedTerms.every((term) => title.includes(term));
	}

	/**
	 * Checks whether a video title contains all required terms
	 * Every "*" term must appear in the title
	 * @param {string} title - The video title
	 * @returns {boolean} Whether the title contains all required terms
	 */
	function matchesRequiredTerms(title) {
		if (requiredTerms.length === 0) {
			return true;
		}

		return requiredTerms.every((term) => title.includes(term));
	}
	// End Matches functions
	// ------------------------------------------------------------
	//

	/**
	 * Filters a video result element based on the search query terms
	 * @param {Element} video - The video result element
	 */
	function filterVideo(video) {
		const title = getVideoTitle(video);
		console.count("Single filter called");
		if (!title) {
			return;
		}

		const excludedMatch = matchesExcludedTerm(title);
		if (excludedMatch) {
			video.style.setProperty("display", "none", "important");
			video.setAttribute("data-excluded-filter-match", "true");
			return;
		}

		const requiredMatch = matchesRequiredTerms(title);
		if (!requiredMatch) {
			video.style.setProperty("display", "none", "important");
			video.setAttribute("data-required-filter-fail", "true");
			return;
		}

		// const positiveMatch = matchesPositiveTerms(title);
		if (false) {
			const color = "#006F9F"; // alt: #075B7A
			video.style.setProperty("background-color", color, "important");
			video.style.setProperty("border", `6px solid ${color}`, "important");
			video.style.setProperty("box-shadow", `0 0 25px ${color}`, "important");
			video.style.setProperty("border-radius", "8px");
		}
	}
	// ------------------------------------------------------------
	// Watch for new videos being added
	// ------------------------------------------------------------

	const observer = new MutationObserver((mutations) => {
		if (location.pathname !== "/results") {
			// console.log("Not on YouTube search results page, skipping filter.");
			return;
		}

		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) {
					continue;
				}

				if (node.matches("ytd-video-renderer")) {
					filterVideo(node);
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	document.addEventListener("yt-navigate-finish", () => {
		// console.log("YouTube navigation completed");
		setFilters();
	});

	// ------------------------------------------------------------
	// Initial execution
	//...
})();
