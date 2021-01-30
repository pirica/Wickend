import fetch from 'node-fetch';
import fs from 'fs';

export default async function CreateMappingsFolderAndUSMAPFile() {
    const map = await (await fetch((await (await fetch('https://benbotfn.tk/api/v1/mappings')).json())[0].url)).text();

    if(!fs.existsSync('./mappings')) {
        fs.mkdirSync('./mappings');
        fs.mkdirSync('./mappings/classes');
        fs.mkdirSync('./mappings/enums');
    }

    fs.writeFileSync('./mappings/mappings.usmap', map);
}