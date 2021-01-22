const lazyvids = (() => {
	document.addEventListener('DOMContentLoaded', () => {
		/*
		 * Configuration options and initialise variables.
		 */
		const configObj = window.lazyvidsConfig || {};
		const config = {
			reduceData:
				configObj && configObj.reduceData ? configObj.reduceData : false,
			minBandwidth:
				configObj && configObj.minBandwidth
					? Number.parseFloat(configObj.minBandwidth)
					: 2.0,
			logLevel: configObj && configObj.logLevel ? configObj.logLevel : 'all',
		};

		const log = (message, object) => {
			if (config.logLevel !== 'all') return;
			object
				? window.console.log(`lazyvids: ${message}`, object)
				: window.console.log(`lazyvids: ${message}`);
		};
		const warn = (message, object) => {
			if (config.logLevel === 'silent') return;
			object
				? window.console.warn(`lazyvids: ${message}`, object)
				: window.console.warn(`lazyvids: ${message}`);
		};

		const hasIo =
			typeof window.intersectionObserver === undefined ? false : true;
		let intersectionObserver;

		// Don't load videos on slow connections (optional)
		if (
			config.reduceData &&
			config.minBandwidth &&
			navigator.connection &&
			navigator.connection.downlink &&
			navigator.connection.downlink < config.minBandwidth
		) {
			warn(
				`Slow connection (${navigator.connection.downlink}mbps). Lazy autoplay disabled.`
			);
			return;
		}

		/*
		 * triggerAutplay() is the last step, and main functionality.
		 */
		const triggerAutoplay = video => {
			video.setAttribute('src', video.dataset.src);
			video.setAttribute('autoplay', '');
			video.setAttribute('data-lazyvids', 'loaded');
		};

		/*
		 * Set up IntersectionObserver to respond to lazyvids videos entering
		 * the viewport. requestAnimationFrame() is used to delay processing
		 * until next layout to allow opportunity for styles to 'settle' before
		 * calculations are made — particularly related to display === 'none'.
		 */
		const handleIntersection = (entries, intersectionObserver) => {
			entries.forEach(entry => {
				window.requestAnimationFrame(() => {
					const target = entry.target;

					// Skip non-intersecting elements.
					if (entry.isIntersecting === false) return;

					const styles = getComputedStyle(target);
					const display = styles.getPropertyValue('display');
					if (display === 'none') return;
					triggerAutoplay(target);
					intersectionObserver.unobserve(target);
				});
			});
		};

		/*
		 * Create IntersectionObserver for supported browsers (not IE).
		 */
		if (hasIo) {
			intersectionObserver = new IntersectionObserver(handleIntersection);
		}

		/*
		 * process() method does most of the heavy lifting regarding
		 * handling <video> elements discovered in the DOM.
		 */
		const process = video => {
			// lazyvids videos must have a non-empty data-src attribute
			if (video.dataset.src === undefined || video.dataset.src === '') {
				warn(
					`Video missing data-src attribute or data-src is empty. Lazy autoplay skipped for:`,
					video
				);
				return;
			}

			// lazyvids videos must have a poster image
			if (video.poster === '') {
				triggerAutoplay(video);
				warn(`Video missing poster image. Lazy autoplay disabled for:`, video);
				return;
			}

			// IE fallback — no support for IntersectionObserver
			if (hasIo === false) {
				triggerAutoplay(video);
				warn(`Unsupported browser. Lazy autoplay disabled.`);
				return;
			}

			// Fully supported
			video.setAttribute('lazyvids', 'unloaded');
			intersectionObserver.observe(video);
		};

		/*
		 * Begin processing videos currently in the DOM.
		 */
		const selector = 'video[data-lazyvids]';
		const lazyVideos = document.querySelectorAll(selector);
		log(
			`Initialised — ${lazyVideos.length} ${
				lazyVideos.length === 1 ? 'video' : 'videos'
			} detected`
		);
		for (const video of lazyVideos) {
			process(video);
		}

		/*
		 * Set up mutationObserver to watch for new lazyvids videos being
		 * added to the DOM.
		 */
		const handleMutation = mutationsList => {
			for (const mutation of mutationsList) {
				for (const node of mutation.addedNodes) {
					if (node.tagName !== 'VIDEO' || node.dataset.lazyvids === undefined)
						continue;
					process(node);
				}
			}
		};

		const mutationConfig = {
			childList: true,
			subtree: true,
		};
		const mutationObserver = new MutationObserver(handleMutation);

		// Start observing for new lazyvids videos
		mutationObserver.observe(document, mutationConfig);
	});
})();

export default lazyvids;
