import fetch from 'node-fetch';
import fs from 'fs';

export default async function CreateMappingsFolderAndUSMAPFile() {
    if(!fs.existsSync('./mappings')) {
        fs.mkdirSync('./mappings');
        fs.mkdirSync('./mappings/classes');
        fs.mkdirSync('./mappings/enums');
    }

    const url = (await (await fetch('https://benbotfn.tk/api/v1/mappings')).json())[0].url;

    return console.error(`Auto writing a usmap file doesn't work, download the usmap from (${url}) and place it into the mappings folder.`);
    const map = await (await fetch((await (await fetch('https://benbotfn.tk/api/v1/mappings')).json())[0].url)).text();

    fs.writeFileSync('./mappings/mappings.usmap', map);
}