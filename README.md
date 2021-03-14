# lazyvids.js
 Lazy-load autoplaying HTML5 video the easy way.

## Installation
Install using your favourite package manager.

```shell
$ yarn add lazyvids
```

Import into your project.

```js
import 'lazyvids.js';
```

## Usage
lazyvids.js works by setting attributes on HTML5 video elements, and playing the videos once they are scrolled into view.

1. Add a `[data-lazyvids]` attribute to `<video>` elements that you want to lazy-play.

2. Add `preload="metadata"` or `preload="none"` to the `<video>` to prevent the browser from downloading it when out of view.

3. It's best practice to also include `muted` and `playsinline` attributes, but the library will add them by default.

4. Provide the `<video>` with a `poster` image attribute. A poster image is required for the video to lazy-play by default, but can be disabled using the `lazyvidsConfig` option.

```html
<video data-lazyvids muted playsinline poster="poster.jpg" preload="metadata" src="example.mp4"></video>

<video data-lazyvids muted playsinline preload="metadata" poster="poster.jpg">
  <source src="example.webm" type="video/webm">
  <source src="example.mp4" type="video/mp4">
</video>
```

## Options
Configuration options are available using a `lazyvidsConfig` object on the global `window` object. This must be included in the HTML before the `lazyvids.js` script.

```html
<script>
  window.lazyvidsConfig = {
    logLevel: 'silent',
    ignoreHidden: false,
    minBandwidth: 0,
    reduceData: false,
    requirePoster: true,
  };
</script>
```
|**Option**|**Type**|**Default Value**|**Description**|
|:-----|:-----:|:-----:|:-----|
|`logLevel`|`string`|`silent`|Set logging level: `verbose`, `warn`, `silent`.|
|`ignoreHidden`|`boolean`|`false`|Set whether to skip `<videos>` with `display: hidden`.|
|`minBandwidth`|`number`|`0`|If `reducedData` is `true`, set threshold above which videos will play.|
|`reduceData`|`boolean`|`false`|If `true`, will not play videos if data saver is enabled or bandwidth is below `minBandwidth`.|
|`requirePoster`|`boolean`|`true`|When `false`, will not lazy-play video if poster image is missing.|