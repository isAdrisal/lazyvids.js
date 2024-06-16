// @ts-check

((configObj) => {
  document.addEventListener('DOMContentLoaded', () => {
    /**
     * Configuration options.
     */
    const config = {
      logLevel: configObj?.logLevel ?? 'silent',
      ignoreHidden: configObj?.ignoreHidden ?? false,
      minBandwidth: configObj?.minBandwidth ? Number(configObj.minBandwidth) : 0,
      reduceData: configObj?.reduceData ?? false,
    };

    const log = (message, ...args) => {
      if (config.logLevel !== 'verbose') return;
      window.console.log(`lazyvids: ${message}`, ...args);
    };
    const warn = (message, ...args) => {
      if (config.logLevel === 'silent') return;
      window.console.warn(`lazyvids: ${message}`, ...args);
    };

    const supportsIntersectionObserver = typeof window.IntersectionObserver === 'function';
    let intersectionObserver;

    /**
     * @type {Navigator & CustomNavigator}
     */
    const globalNavigator = window.navigator;
    const downlink = globalNavigator?.connection?.downlink;
    const saveData = globalNavigator?.connection?.saveData;

    if (
      (config.reduceData && config.minBandwidth && downlink && downlink < config.minBandwidth) ||
      (config.reduceData && saveData)
    ) {
      // Don't load videos on slow connections (optional)
      warn(`Slow connection (${globalNavigator.connection?.downlink}mbps). Lazy autoplay disabled.`);
      return;
    }

    /**
     * `playVideo()` is the last step, and main functionality.
     *
     * Set autoplay and muted attributes on the video, and start
     * playing it with .play(). Update data-lazyvids attribute
     * value to prevent re-detecting the video for processing.
     *
     * @param {HTMLVideoElement} video
     */
    const playVideo = (video) => {
      video.muted = true;
      video.autoplay = true;

      if (video.play() !== undefined) {
        video
          .play()
          .then(() => (video.dataset.lazyvids = 'loaded'))
          .catch((error) => warn(`Autoplay blocked by browser for:`, video));
      } else {
        video.dataset.lazyvids = 'loaded';
      }
    };

    /**
     * Utility function to check for video element visibility.
     *
     * @param {HTMLElement} element
     * @returns {boolean} Whether the element would be visible if it was within the viewport. Does not account for occlusion from other elements.
     */
    const isVisible = (element) => {
      if (element.style?.display === 'none' || (config.ignoreHidden && element.style?.visibility === 'hidden')) {
        return false;
      }

      const styles = getComputedStyle(element);
      if (styles.getPropertyValue('display') === 'none') return false;

      if (config.ignoreHidden) {
        if (styles.getPropertyValue('visibility') === 'hidden') return false;
      }

      if (element.parentElement && element.parentElement instanceof HTMLHtmlElement === false)
        return isVisible(element.parentElement);

      return true;
    };

    /**
     * Set up IntersectionObserver to respond to lazyvids videos entering
     * the viewport.
     *
     * @type {IntersectionObserverCallback}
     */
    const handleIntersection = (entries, intersectionObserver) => {
      for (const entry of entries) {
        const target = entry.target;
        if (target instanceof HTMLVideoElement === false || !entry.isIntersecting) continue;

        window.requestAnimationFrame(() => {
          if (isVisible(target) === false) return;
          playVideo(target);
          intersectionObserver.unobserve(target);
        });
      }
    };

    /**
     * Create IntersectionObserver for supported browsers (not IE).
     */
    if (supportsIntersectionObserver) {
      intersectionObserver = new IntersectionObserver(handleIntersection);
    }

    /**
     * `process()` method does most of the heavy lifting regarding
     * handling <video> elements discovered in the DOM.
     *
     * @param {HTMLVideoElement} video
     */
    const process = (video) => {
      // IE fallback — no support for IntersectionObserver
      if (supportsIntersectionObserver === false) {
        playVideo(video);
        warn(`Unsupported browser. Lazy autoplay disabled.`);
        return;
      }

      // Fully supported
      video.dataset.lazyvids = 'unloaded';
      intersectionObserver.observe(video);
    };

    /**
     * Begin processing videos currently in the DOM.
     */
    const domSelector = 'video[data-lazyvids]:not([data-lazyvids=loaded]):not([data-lazyvids=false])';
    const lazyVideos = document.querySelectorAll(domSelector);
    log(`Initialised — ${lazyVideos.length} ${lazyVideos.length === 1 ? 'video' : 'videos'} detected`);
    for (const video of lazyVideos) {
      if (video instanceof HTMLVideoElement === false) continue;
      process(video);
    }

    /**
     * Set up mutationObserver to watch for new lazyvids videos being
     * added to the DOM.
     *
     * If added node is not a `<video>`, search within the added node
     * for lazyvid videos.
     *
     * @type {MutationCallback}
     */
    const handleMutation = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type !== 'childList') continue;

        for (const node of mutation.addedNodes) {
          if (
            node instanceof HTMLVideoElement &&
            node.dataset.lazyvids !== undefined &&
            node.dataset.lazyvids !== 'loaded' &&
            node.dataset.lazyvids !== 'false'
          ) {
            process(node);
            continue;
          }

          if (node instanceof HTMLElement === false || !node.hasChildNodes()) continue;

          const nestedLazyvids = node.querySelectorAll(domSelector);
          for (const video of nestedLazyvids) {
            if (video instanceof HTMLVideoElement === false) continue;
            process(video);
          }
        }
      }
    };

    // Start observing for new lazyvids videos
    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document, {
      childList: true,
      subtree: true,
    });
  });
  // @ts-ignore-next-line
})(window?.lazyvidsConfig || {});

/**
 * @typedef {Object} CustomNavigator
 * @property {NavigatorConnection} [connection] - Information about the network connection. (may not be supported by all browsers)

 * @typedef {Object} NavigatorConnection
 * @property {number} [downlink] - The effective downlink speed in megabits per second (Mbps).
 * @property {boolean} [saveData] - Indicates if the user has enabled data saver mode.
 * 
 */
