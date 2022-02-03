((configObj) => {
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

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

    const log = (message, object = '') => {
      if (config.logLevel !== 'verbose') return;
      window.console.log(`lazyvids: ${message}`, object);
    };
    const warn = (message, object = '') => {
      if (config.logLevel === 'silent') return;
      window.console.warn(`lazyvids: ${message}`, object);
    };

    const supportsIntersectionObserver = typeof window.IntersectionObserver === 'function';
    let intersectionObserver;

    /**
     * Don't load videos on slow connections (optional)
     */
    if (
      config.reduceData &&
      config.minBandwidth &&
      (navigator.connection?.downlink < config.minBandwidth || navigator.connection?.saveData)
    ) {
      warn(`Slow connection (${navigator.connection?.downlink}mbps). Lazy autoplay disabled.`);
      return;
    }

    /**
     * `playVideo()` is the last step, and main functionality.
     *
     * Set autoplay, muted and playsinline attributes on the video,
     * and start playing it with .play(). Update data-lazyvids attribute
     * value to prevent re-detecting the video for processing.
     */
    const playVideo = (video) => {
      video.playsinline = true;
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
     */
    const isVisible = (element) => {
      if (element.style?.display === 'none') return false;
      if (config.ignoreHidden && element.style?.visibility === 'hidden') return false;
      const styles = getComputedStyle(element);
      const display = styles.getPropertyValue('display');
      if (display === 'none') return false;
      if (config.ignoreHidden) {
        const visibility = styles.getPropertyValue('visibility');
        if (visibility === 'hidden') return false;
      }
      if (element.parentNode && element.parentNode !== document) return isVisible(element.parentNode);
      return true;
    };

    /**
     * Set up IntersectionObserver to respond to lazyvids videos entering
     * the viewport.
     */
    const handleIntersection = (entries, intersectionObserver) => {
      entries.forEach((entry) => {
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
    if (supportsIntersectionObserver) {
      intersectionObserver = new IntersectionObserver(handleIntersection);
    }

    /**
     * `process()` method does most of the heavy lifting regarding
     * handling <video> elements discovered in the DOM.
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
    lazyVideos.forEach((video) => process(video));

    /**
     * Set up mutationObserver to watch for new lazyvids videos being
     * added to the DOM.
     *
     * If added node is not a <video>, search within the added node
     * for lazyvid videos.
     */
    const handleMutation = (mutationsList) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node.tagName === 'VIDEO' &&
            node.dataset.lazyvids !== undefined &&
            node.dataset.lazyvids !== 'loaded' &&
            node.dataset.lazyvids !== 'false'
          ) {
            process(node);
            return;
          }
          if (node.hasChildNodes() === false) return;
          const nestedLazyvids = node.querySelectorAll(domSelector);
          nestedLazyvids.forEach((videoNode) => process(videoNode));
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
