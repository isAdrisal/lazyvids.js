(configObj => {
	if (window.NodeList && !NodeList.prototype.forEach) {
		NodeList.prototype.forEach = Array.prototype.forEach;
	}

	document.addEventListener('DOMContentLoaded', () => {
		/**
		 * Configuration options.
		 */
		const config = {
			logLevel: configObj && configObj.logLevel ? configObj.logLevel : 'silent',
			ignoreHidden:
				configObj && configObj.ignoreHidden ? configObj.ignoreHidden : false,
			minBandwidth:
				configObj && configObj.minBandwidth
					? Number.parseFloat(configObj.minBandwidth)
					: 0,
			reduceData:
				configObj && configObj.reduceData ? configObj.reduceData : false,
			requirePoster:
				configObj && configObj.requirePoster ? configObj.requirePoster : true,
		};

		const log = (message, object) => {
			if (config.logLevel !== 'verbose') return;
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
			typeof window.intersectionObserver === undefined ||
			typeof window.intersectionObserver === 'undefined'
				? false
				: true;
		let intersectionObserver;

		// Don't load videos on slow connections (optional)
		if (
			config.reduceData &&
			config.minBandwidth &&
			navigator.connection &&
			navigator.connection.downlink &&
			(navigator.connection.downlink < config.minBandwidth ||
				navigator.connection.saveData)
		) {
			warn(
				`Slow connection (${navigator.connection.downlink}mbps). Lazy autoplay disabled.`
			);
			return;
		}

		/**
		 * `playVideo()` is the last step, and main functionality.
		 *
		 * Set autoplay, muted and playsinline attributes on the video,
		 * and start playing it with .play(). Update data-lazyvids attribute
		 * value to prevent re-detecting the video for processing.
		 */
		const playVideo = video => {
			video.setAttribute('playsinline', '');
			video.setAttribute('muted', '');
			video.setAttribute('autoplay', '');
			video.play();
			video.setAttribute('data-lazyvids', 'loaded');
		};

		/**
		 * Utility function to check for video element visibility.
		 */
		const isVisible = element => {
			if (
				element.style &&
				element.style.display &&
				element.style.display === 'none'
			)
				return false;
			if (
				config.ignoreHidden &&
				element.style &&
				element.style.visibility &&
				element.style.visibility === 'hidden'
			)
				return false;
			const styles = getComputedStyle(element);
			const display = styles.getPropertyValue('display');
			if (display === 'none') return false;
			if (config.ignoreHidden) {
				const visibility = styles.getPropertyValue('visibility');
				if (visibility === 'hidden') return false;
			}
			if (element.parentNode && element.parentNode !== document)
				return isVisible(element.parentNode);
			return true;
		};

		/**
		 * Set up IntersectionObserver to respond to lazyvids videos entering
		 * the viewport.
		 */
		const handleIntersection = (entries, intersectionObserver) => {
			entries.forEach(entry => {
				window.requestAnimationFrame(() => {
					const target = entry.target;
					if (entry.isIntersecting === false) return;
					if (isVisible(target) === false) return;
					playVideo(target);
					intersectionObserver.unobserve(target);
				});
			});
		};

		/**
		 * Create IntersectionObserver for supported browsers (not IE).
		 */
		if (hasIo) {
			intersectionObserver = new IntersectionObserver(handleIntersection);
		}

		/**
		 * `process()` method does most of the heavy lifting regarding
		 * handling <video> elements discovered in the DOM.
		 */
		const process = video => {
			// lazyvids videos must have a poster image (default)
			if (
				config.requirePoster &&
				(video.poster === undefined || video.poster === '')
			) {
				playVideo(video);
				warn(`Video missing poster image. Lazy autoplay disabled for:`, video);
				return;
			}

			// IE fallback — no support for IntersectionObserver
			if (hasIo === false) {
				playVideo(video);
				warn(`Unsupported browser. Lazy autoplay disabled.`);
				return;
			}

			// Fully supported
			video.setAttribute('data-lazyvids', 'unloaded');
			intersectionObserver.observe(video);
		};

		/**
		 * Begin processing videos currently in the DOM.
		 */
		const selector = 'video[data-lazyvids]:not([data-lazyvids=loaded])';
		const lazyVideos = document.querySelectorAll(selector);
		log(
			`Initialised — ${lazyVideos.length} ${
				lazyVideos.length === 1 ? 'video' : 'videos'
			} detected`
		);
		lazyVideos.forEach(video => process(video));

		/**
		 * Set up mutationObserver to watch for new lazyvids videos being
		 * added to the DOM.
		 */
		const handleMutation = mutationsList => {
			mutationsList.forEach(mutation => {
				mutation.addedNodes.forEach(node => {
					if (
						node.tagName !== 'VIDEO' ||
						node.dataset.lazyvids === undefined ||
						node.dataset.lazyvids === 'loaded'
					)
						return;
					process(node);
				});
			});
		};

		const mutationConfig = {
			childList: true,
			subtree: true,
		};
		const mutationObserver = new MutationObserver(handleMutation);

		// Start observing for new lazyvids videos
		mutationObserver.observe(document, mutationConfig);
	});
})(window.lazyvidsConfig || {});
