# Wickend
An easier way to use the popularly known nodejs package called [node-wick](https://github.com/SirWaddles/node-wick) made by [SirWaddles](https://github.com/SirWaddles).

Please the information at [node-wick](https://github.com/SirWaddles/node-wick#extracting) as it is important due to the only way this library will work.

## Example
Examples of how to use this library.

### Create mappings.
A function that uses benbot's mappings files and endpoint and creates a *mappings* folder that has 2 folders classes, and enums and the mapping file called mappings.usmap.

```js
import { Mappings } from 'wickend';

Mappings();
```

## Wick
Easier way to use node-wick.

```js
import { Mappings, Wick } from '../index.mjs';
import fetch from 'node-fetch';

Mappings();

(async () => {
    const chain = await (await fetch('https://benbotfn.tk/api/v1/aes')).json();

    const wick = new Wick({
        extract: false,
        chain,
        path: '' // path to pak files,
        log: console.log
    });

    await wick.extract();
})();
```

### Functions

## getJSON
Searches through all extractors and try to find the file and extract the JSON.

- **{String}** file The path.

### Usage
```js
wick.getJSON('path');
```

## getEID
Returns data about a Emote.

- **{String}** EID ID of a emote.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getEID();
```

## getCID
Returns data about a Skin.

- **{String}** CID ID of a Skin.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getCID();
```

## async extract
Extracts all files in **directory** property defined in the *constructor*.

### Usage
```js
await wick.extract();
```

## getKey
Get AES Key for a package.

- **{String}** pak Package name.

### Usage
```js
const key = wick.getKey('');
```

## Issues
Please create a [issue](https://github.com/Tectors/Wick/issues/new) and I'll happily be able to respond and help, if you have a fix create a [pull request](https://github.com/Tectors/Wick/compare).
