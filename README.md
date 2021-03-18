# lazyvids.js

A small utility to lazy-load autoplay HTML5 videos once they enter the viewport.

## Installation

Install using your favourite package manager.

```shell
$ yarn add lazyvids
```

Import into your project.

```js
import 'lazyvids';
```

## Usage

lazyvids.js works by setting attributes on HTML5 video elements, and playing the videos once they are scrolled into view.

1. Add a `[data-lazyvids]` attribute to `<video>` elements that you want to lazy-play.

2. Add `preload="none"` to the `<video>` to prevent the browser from downloading it when out of view. `preload="metadata"` is preferred, but does not work as it should in Safari (🙄).

3. It's best practice to also include `muted` and `playsinline` attributes, but the library will add them by default.

4. Provide the `<video>` with a `poster` image attribute. A poster image is required for the video to lazy-play by default, but this behaviour can be changed using the relevant `lazyvidsConfig` option.

```html
<video
  data-lazyvids
  muted
  playsinline
  preload="none"
  poster="poster.jpg"
  src="example.mp4"
></video>

<video data-lazyvids muted playsinline preload="none" poster="poster.jpg">
  <source src="example.webm" type="video/webm" />
  <source src="example.mp4" type="video/mp4" />
</video>
```

## Options

Configuration options are available using a `lazyvidsConfig` object on the global `window` object. This must be included in the HTML before the `lazyvids` script.

```html
<script>
  window.lazyvidsConfig = lazyvidsConfig || {};
  lazyvidsConfig = {
    logLevel: 'silent',
    ignoreHidden: false,
    minBandwidth: 0,
    reduceData: false,
    requirePoster: true,
  };
</script>
```

| **Option** | **Type** | **Default Value** | **Description** |
| :-: | :-: | :-: | :-- |
| `logLevel` | `string` | `silent` | Set logging level: `verbose`, `warn`, `silent`. |
| `ignoreHidden` | `boolean` | `false` | Set whether to skip `<videos>` with `display: hidden`. |
| `minBandwidth` | `number` | `0` | If `reducedData` is `true`, set threshold above which videos will play. |
| `reduceData` | `boolean` | `false` | If `true`, will not play videos if data saver is enabled or bandwidth is below `minBandwidth`. |
| `requirePoster` | `boolean` | `true` | When `false`, will lazy-play video even if poster image is missing. |
