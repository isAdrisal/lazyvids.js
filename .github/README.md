# lazyvids.js

A small utility to lazy-load autoplay HTML5 videos once they enter the viewport.

## Installation

Install using your favourite package manager.

```shell
$ npm install lazyvids
```

Import into your project.

```js
import "lazyvids";
```

## Usage

lazyvids.js works by setting attributes on HTML5 video elements, and playing the videos once they are scrolled into view.

1. Add a `[data-lazyvids]` attribute to `<video>` elements that you want to lazy-play.

2. Add `preload="none"` to the `<video>` to prevent the browser from downloading it when out of view. `preload="metadata"` is preferred, but does not work as it should in Safari (🙄).

3. It's best practice to also include `muted` and `playsinline` attributes, but the library will add them by default.

4. Provide the `<video>` with a `poster` image attribute.

```html
<video data-lazyvids muted playsinline preload="none" poster="poster.jpg" src="example.mp4"></video>

<video data-lazyvids muted playsinline preload="none" poster="poster.jpg">
  <source src="example.webm" type="video/webm" />
  <source src="example.mp4" type="video/mp4" />
</video>
```

## Options

Configuration options are available using a `lazyvidsConfig` object on the global `window` object.

```html
<script>
  window.lazyvidsConfig = lazyvidsConfig || {};
  lazyvidsConfig = {
    logLevel: "silent",
    ignoreHidden: false,
    minBandwidth: 0,
    reduceData: false,
  };
</script>
```

|   **Option**   | **Type**  | **Default Value** | **Description**                                                                                |
| :------------: | :-------: | :---------------: | :--------------------------------------------------------------------------------------------- |
|   `logLevel`   | `string`  |     `silent`      | Set logging level: `verbose`, `warn`, `silent`.                                                |
| `ignoreHidden` | `boolean` |      `false`      | Set whether to skip `<video>` elements with `display: hidden`.                                 |
| `minBandwidth` | `number`  |        `0`        | If `reduceData` is `true`, set threshold above which videos will play.                         |
|  `reduceData`  | `boolean` |      `false`      | If `true`, will not play videos if data saver is enabled or bandwidth is below `minBandwidth`. |

## Contributing

### Getting started

> [!IMPORTANT]
> It's expected that `nvm` and `npm` are already installed.

1. Clone this repository.

2. Run `nvm use` to use the specified `node` version.

3. Run `npm install` to install dev dependencies.

4. Run `npm test` to run the test suite and ensure that everything is working as expected.

### Making changes

The source can be found in `src/`, and is contained within a single file without dependencies.

`esbuild` is used to transpile the code for publication to support older syntax. However, it is important to ensure that browser APIs used within the source are compatible with the intended browser targets to avoid the need for polyfills.

### Testing changes

The test suite can be run using `npm test`.

It uses `@web/test-runner` with `playwright` to run the tests in real browsers locally on your computer.

Testing code is co-located with the test fixtures within `*.test.html` files in `test/`.
