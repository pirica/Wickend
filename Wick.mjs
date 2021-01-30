import nodeWick from 'node-wick';
import fs from 'fs';

const { Extractor, Package } = nodeWick;
const filter = (f) => f.endsWith('.pak');

/**
 * Easier way to use node-wick.
 * 
 * Version
 * - Node v14.15.0
 * - node-wick 5.0.0
 */
export default class Wick {
    /**
     * @param {Object} data Settings.
     * @param {Boolean} data.extract If files are extracted when instance is created.
     * #### Default: true
     * - true
     * - false
     * @param {Object} data.chain AES Keys 
     * - https://benbotfn.tk/api/v1/aes
     * @param {String} data.path Path to the pak files.
     * @param {Object} data.extractors Extra extractors if you have any.
     * @param {Function} data.filter Filter of any file in the pak files.
     * - (f) => f.endsWith('.pak')
     * @param {Function} data.log Log function.
     */
    constructor(data={
        extract: true,
        chain: null,
        path: null,
        extractors: {},
        filter,
        log: console.log
    }) {
        /**
         * Path to the pak files.
         * 
         * @type String
         */
        this.path = data.path;

        /**
         * Extractors.
         * 
         * @type Extractor
         */
        this.extractors = data.extractors ? data.extractors : {};

        /**
         * AES keys.
         * 
         * @type Object
         */
        this.chain = data.chain;

        /**
         * If files have been extracted.
         */
        this.extracted = false;

        /**
         * Log function if there is any.
         * 
         * @type Function
         */
        this.log = data.log;

        /**
         * All files in the path.
         * 
         * @type Array
         */
        this.directory = fs.readdirSync(data.path).filter(data.filter || filter).map(f => f.split('.')[0]);
        
        /**
         * Package class from **node-wick**.
         * 
         * @type class
         */
        this.Package = Package;

        if(data.extract) {
            console.log('Auto extract has started an "extracted" property, wait for the property to become true.');
            console.log('You can always call the function and wait for the value to come back as that\'s easier.');
            this.extract();
        }
    }

    /**
     * Extracts all files in **directory** property defined in the *constructor*.
     * 
     * @returns Array
     */

    async extract() {
        await this.whiler(this.directory, (directory) => {
            const path = this.path + directory;

            return new Promise(async (resolve) => {
                const key = this.getKey(directory) || this.chain.mainKey;
                
                const extractor = await new Promise((resolve) => {
                    try {
                        resolve(new Extractor(path, key));
                    } catch(err) {
                        if(this.log) this.log('\x1b[31m%s\x1b[0m', `Package ${directory} failed using ${key}`);
                        resolve(null);
                    }
                });

                if(extractor) {
                    if(this.extractors[directory]) return;
                    this.extractors[directory] = extractor;
    
                    if(this.log) this.log('\x1b[32m%s\x1b[0m', `Package ${directory} worked with key ${key}: ${extractor.get_file_list().length} files`);
    
                    resolve(true);
                } else resolve(null);
            });
        });

        this.extracted = true;
        return this.extractors;
    }

    /**
     * Searches through all extractors and try to find the file and extract the JSON.
     * 
     * @returns Object
     */
    getJSON(file) {
        let json = null;

        Object.keys(this.extractors).map(e => this.extractors[e]).forEach((extractor) => {
            try {
                const Pak = new Package(extractor.get_file(file));
                console.log(Pak, 'sad')
            } catch(err) {
                console.log(err);
            }
        });
    }

    /**
     * Get AES Key for a package.
     * 
     * @param {String} pak Package name.
     */
    getKey(pak) {
        return this.dynamicKeys[pak];
    }

    /**
     * Asynchronous forEach function using *while*.
     * 
     * @param {(Object|Array)} array To be looped.
     * @param {Function} func Function on each element.
     * @param {Boolean} keys If param *array* is a Object.
     */
    async whiler(array, func, keys=false) {
        let length = keys ? Object.keys(array).length : array.length;
        
        while(length--) await func(keys ? Object.keys(array)[length] : array[length], length);
      
        return true;
    }

    /**
     * All files in all extractors.
     * 
     * @returns Array
     */
    get files() {
        const files = [];

        Object.keys(this.extractors).map(e => files.push(...this.extractors[e].get_file_list()));

        return files.filter(f => f && f !== '');
    }

    /**
     * All dynamicKeys with names.
     * 
     * @returns Object
     */
    get dynamicKeys() {
        const { dynamicKeys } = this.chain;

        const keys = {};

        Object.keys(dynamicKeys).forEach((key) => {
            keys[key.split('/').pop().split('.')[0]] = dynamicKeys[key];
        });

        return keys;
    }
}