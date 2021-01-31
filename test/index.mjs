import fetch from 'node-fetch';
import { Wick } from '../index.mjs';

const path = 'C:\\Games\\Fortnite\\FortniteGame\\Content\\Paks\\';

(async () => {
    const chain = await (await fetch('https://benbotfn.tk/api/v1/aes')).json();

    const wick = new Wick({
        extract: false,
        chain,
        path,
        log: console.log
    });

    global.wick = wick;

    await wick.extract();

    await new Promise((resolve) => {
        setTimeout(() => {
            
        }, 10000000)
    })
})();