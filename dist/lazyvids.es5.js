"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var lazyvids = function (configObj) {
  document.addEventListener('DOMContentLoaded', function () {
    /**
     * Configuration options.
     */
    var config = {
      logLevel: configObj && configObj.logLevel ? configObj.logLevel : 'silent',
      ignoreHidden: configObj && configObj.ignoreHidden ? configObj.ignoreHidden : false,
      minBandwidth: configObj && configObj.minBandwidth ? Number.parseFloat(configObj.minBandwidth) : 0,
      reduceData: configObj && configObj.reduceData ? configObj.reduceData : false,
      requirePoster: configObj && configObj.requirePoster ? configObj.requirePoster : true
    };

    var log = function log(message, object) {
      if (config.logLevel !== 'verbose') return;
      object ? window.console.log("lazyvids: ".concat(message), object) : window.console.log("lazyvids: ".concat(message));
    };

    var warn = function warn(message, object) {
      if (config.logLevel === 'silent') return;
      object ? window.console.warn("lazyvids: ".concat(message), object) : window.console.warn("lazyvids: ".concat(message));
    };

    var hasIo = _typeof(window.intersectionObserver) === undefined ? false : true;
    var intersectionObserver; // Don't load videos on slow connections (optional)

    if (config.reduceData && config.minBandwidth && navigator.connection && navigator.connection.downlink && (navigator.connection.downlink < config.minBandwidth || navigator.connection.saveData)) {
      warn("Slow connection (".concat(navigator.connection.downlink, "mbps). Lazy autoplay disabled."));
      return;
    }
    /**
     * `playVideo()` is the last step, and main functionality.
     *
     * Set autoplay, muted and playsinline attributes on the video,
     * and start playing it with .play(). Update data-lazyvids attribute
     * value to prevent re-detecting the video for processing.
     */


    var playVideo = function playVideo(video) {
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
      video.play();
      video.setAttribute('data-lazyvids', 'loaded');
    };
    /**
     * Utility function to check for video element visibility.
     */


    var isVisible = function isVisible(element) {
      if (element.style && element.style.display && element.style.display === 'none') return false;
      if (config.ignoreHidden && element.style && element.style.visibility && element.style.visibility === 'hidden') return false;
      var styles = getComputedStyle(element);
      var display = styles.getPropertyValue('display');
      if (display === 'none') return false;

      if (config.ignoreHidden) {
        var visibility = styles.getPropertyValue('visibility');
        if (visibility === 'hidden') return false;
      }

      if (element.parentNode && element.parentNode !== document) return isVisible(element.parentNode);
      return true;
    };
    /**
     * Set up IntersectionObserver to respond to lazyvids videos entering
     * the viewport.
     */


    var handleIntersection = function handleIntersection(entries, intersectionObserver) {
      entries.forEach(function (entry) {
        window.requestAnimationFrame(function () {
          var target = entry.target;
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


    var process = function process(video) {
      // lazyvids videos must have a poster image (default)
      if (config.requirePoster && (video.poster === undefined || video.poster === '')) {
        playVideo(video);
        warn("Video missing poster image. Lazy autoplay disabled for:", video);
        return;
      } // IE fallback — no support for IntersectionObserver


      if (hasIo === false) {
        playVideo(video);
        warn("Unsupported browser. Lazy autoplay disabled.");
        return;
      } // Fully supported


      video.setAttribute('data-lazyvids', 'unloaded');
      intersectionObserver.observe(video);
    };
    /**
     * Begin processing videos currently in the DOM.
     */


    var selector = 'video[data-lazyvids]:not([data-lazyvids=loaded])';
    var lazyVideos = Array.from(document.querySelectorAll(selector));
    log("Initialised \u2014 ".concat(lazyVideos.length, " ").concat(lazyVideos.length === 1 ? 'video' : 'videos', " detected"));
    lazyVideos.forEach(function (video) {
      return process(video);
    });
    /**
     * Set up mutationObserver to watch for new lazyvids videos being
     * added to the DOM.
     */

    var handleMutation = function handleMutation(mutationsList) {
      mutationsList.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.tagName !== 'VIDEO' || node.dataset.lazyvids === undefined || node.dataset.lazyvids === 'loaded') return;
          process(node);
        });
      });
    };

    var mutationConfig = {
      childList: true,
      subtree: true
    };
    var mutationObserver = new MutationObserver(handleMutation); // Start observing for new lazyvids videos

    mutationObserver.observe(document, mutationConfig);
  });
}(window.lazyvidsConfig || {});

var _default = lazyvids;
exports["default"] = _default;
