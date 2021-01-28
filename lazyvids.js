/**
 * Lazy-loading videos.
 */
const lazyvids = (() => {
	document.addEventListener('DOMContentLoaded', () => {
		/**
		 * Configuration options.
		 */
		const configObj = window.lazyvidsConfig || {};
		const config = {
			logLevel: configObj && configObj.logLevel ? configObj.logLevel : 'silent',
			ignoreHidden:
				configObj && configObj.ignoreHidden ? configObj.ignoreHidden : false,
			minBandwidth:
				configObj && configObj.minBandwidth
					? Number.parseFloat(configObj.minBandwidth)
					: 2.0,
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

		/**
		 * `triggerAutoplay()` is the last step, and main functionality.
		 * If present, `<source>` nodes are replaced with new `<source>` nodes
		 * including a `src` attribute — rather than by updating the `src`
		 * attribute of the original `<source>` node. Updating the `src` attribute
		 * alone does not correctly update the `<video>` element's currentSrc.
		 *
		 * If `<source>` nodes are not used, `<video>` element `src` attribute is updated.
		 *
		 * Finally, `autoplay` attribute is set, and `data-lazyvids` value set to `loaded`.
		 */
		const triggerAutoplay = video => {
			const sourceNodes = Array.from(video.querySelectorAll('source'));
			if (sourceNodes.length > 0) {
				const fragment = document.createDocumentFragment();
				for (const source of sourceNodes) {
					const src = source.dataset.src;
					const type = source.type;
					const newSource = document.createElement('source');
					newSource.setAttribute('src', src);
					if (type !== '') newSource.setAttribute('type', type);
					fragment.appendChild(newSource);
				}
				window.requestAnimationFrame(() => video.appendChild(fragment));
			} else {
				window.requestAnimationFrame(() =>
					video.setAttribute('src', video.dataset.src)
				);
			}
			window.requestAnimationFrame(() => {
				video.setAttribute('autoplay', '');
				video.setAttribute('data-lazyvids', 'loaded');
			});
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
					triggerAutoplay(target);
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
			/**
			 * lazyvids videos must have a non-empty `data-src` attribute on either the
			 * main `<video>` element, or all child `<source>` nodes.
			 */
			const sourceNodes = Array.from(video.querySelectorAll('source'));
			const hasSourceNodes = sourceNodes.length > 0;
			let hasVideoDataSrc;
			let hasSourceDataSrc;

			const hasDataSrc = node =>
				node.dataset.src !== undefined && node.dataset.src !== '';

			hasVideoDataSrc = hasDataSrc(video);

			if (hasSourceNodes) {
				for (const source of sourceNodes) {
					if (hasDataSrc(source) === false) {
						hasSourceDataSrc = false;
						break;
					}
				}
			}

			if (
				(hasSourceNodes && hasSourceDataSrc === false) ||
				(hasSourceNodes === false && hasVideoDataSrc === false)
			) {
				warn(
					`Video missing data-src attribute or data-src is empty. Lazy autoplay skipped for:`,
					video
				);
				return;
			}

			// lazyvids videos must have a poster image
			if (
				config.requirePoster &&
				(video.poster === undefined || video.poster === '')
			) {
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
		for (const video of lazyVideos) {
			process(video);
		}

		/**
		 * Set up mutationObserver to watch for new lazyvids videos being
		 * added to the DOM.
		 */
		const handleMutation = mutationsList => {
			for (const mutation of mutationsList) {
				for (const node of mutation.addedNodes) {
					if (
						node.tagName !== 'VIDEO' ||
						node.dataset.lazyvids === undefined ||
						node.dataset.lazyvids === 'loaded'
					)
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
