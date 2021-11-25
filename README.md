# Wickend
An easier way to use the popularly known nodejs package called [node-wick](https://github.com/SirWaddles/node-wick) made by [SirWaddles](https://github.com/SirWaddles).

## No further updates..
# Use [Unreal.js](https://github.com/Sprayxe/unreal.js), I have other things to do sorry.

Please the information at [node-wick](https://github.com/SirWaddles/node-wick#extracting) as it is important due to the only way this library will work.

## Example
Examples of how to use this library.

### Create mappings.

**NOTE: Mappings aren't being written correctly so running this function will give you a error about it**

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

    await wick.extractAll();
})();
```

### Functions

## exportObject
Exports the file's object, by using the `wick.extraction` object full of paths.

- **{String}** file The path.

### Usage
```js
wick.exportObject('path');
```

## exportTexture
Exports the file's texture, by using the `wick.extraction` object full of paths.

- **{String}** file The path.

### Usage
```js
fs.writeFileSync("asset.png", wick.exportTexture('path'));
```

## getTandem
Returns data about a Tandem.

- **{String}** id Name of a Tandem.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getTandem();
```

## getEmote
Returns data about a Emote.

- **{String}** EID ID of a emote.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getEmote();
```

## getContrail
Get Contrail by ID.

- **{String}** TID The ID of a Contrail.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getContrail();
```

## getLoadingScreen
Get Loading Screen by ID.

- **{String}** LSID The ID of a Loading Scren.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getLoadingScreen();
```

## getSpray
Get Spray by ID.

- **{String}** SPID The ID of a Spray.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getSpray();
```

## getWeapon
Get a Weapon.

- **{String}** id The ID of a Weapon.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getWeapon();
```

## getPickaxeID
Returns data about a Pickaxe.

- **{String}** PID ID of a Pickaxe.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getPickaxeID();
```

## getWrap
Returns data about a Wrap.

- **{String}** WID ID of a Wrap.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getWrap();
```

## getToy
Returns data about a Toy.

- **{String}** TYID ID of a Toy.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getToy();
```

## getMusicPack
Returns data about a Music Pack.

- **{String}** MID ID of a Music Pack.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getMusicPack();
```

## getGlider
Returns data about a Glider.

- **{String}** GID ID of a Glider.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getGlider();
```

## getCharacter
Returns data about a Character.

- **{String}** CID ID of a Character.
- **{Boolean}** beautified If the returned data is beautified or not.

### Usage
```js
wick.getCharacter();
```

## async extract
Extracts a pak file.

- **{String}** file The pak file name.
- **{String}** keyer The key for the pak file.

### Usage
```js
await wick.extract('pak', 'key');
```

## async extractAll
Extracts all files in **directory** property defined in the *constructor*.

### Usage
```js
await wick.extractAll();
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
