import { Mappings, Wick } from '../index.mjs';
import fetch from 'node-fetch';

Mappings();

(async () => {
    const chain = await (await fetch('https://benbotfn.tk/api/v1/aes')).json();

    const wick = new Wick({
        extract: false,
        chain,
        path: 'C:\\Games\\Fortnite\\FortniteGame\\Content\\Paks\\',
        log: console.log
    });

    await wick.extract();
})();