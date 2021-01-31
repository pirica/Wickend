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
         * Sorting of data.
         * 
         * @type {Object}
         */
        this.sorting = {
            Characters: 'FortniteGame/Content/Athena/Items/Cosmetics/Characters/',
            Heroes: 'FortniteGame/Content/Athena/Heroes/HID_',
            Emotes: 'FortniteGame/Content/Athena/Items/Cosmetics/Dances/',
            Backpacks: 'FortniteGame/Content/Athena/Items/Cosmetics/Backpacks/',
            Specializations: 'FortniteGame/Content/Athena/Heroes/Specializations/',
            Series: 'FortniteGame/Content/Athena/Items/Cosmetics/Series/',
            // Textures: [
            //     'FortniteGame/Content/Characters/Player',
            //     'Textures'
            // ],
            Meta: 'FortniteGame/Content/Athena/Items/Cosmetics/Metadata/',
            // BackMesh: 'FortniteGame/Content/Accessories/FORT_Backpacks/'
        }

        /**
         * Sorted data.
         * 
         * @type {Object}
         */
        this.sorted = {};

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

                    const files = extractor.get_file_list();
                    this.sort(files, extractor);

                    if(this.log) this.log('\x1b[32m%s\x1b[0m', `Package ${directory} worked with key ${key}: ${files.length} files`);
    
                    resolve(true);
                } else resolve(null);
            });
        });

        this.extracted = true;
        return this.extractors;
    }

    /**
     * Sorts files.
     * 
     * @param {Array} files Array of files.
     * @param {Class} extractor Extractor class.
     */
    sort(files, extractor) {
        return new Promise(async (resolve) => {
            await this.whiler(Object.keys(this.sorting), (type) => {
                const value = Array.isArray(this.sorting[type]) ? this.sorting[type][0] : this.sorting[type];
                const filtered = !Array.isArray(this.sorting[type]) ? files.filter(f => f.startsWith(value)) : files.filter(f => f.startsWith(value) && f.includes(this.sorting[type][1]));

                if(filtered.length > 5) {
                    if(!this.sorted[type]) this.sorted[type] = {};

                    filtered.forEach((f) => {
                        try {
                            const raw = extractor.get_file(f);
                            const data = new Package(raw);
                            const json = data.get_data();
                            if(json.exports[0]) json._path = f;
                            json._name = f.split('/').pop().split('.')[0];
                            this.sorted[type][f.split('/').pop().split('.')[0]] = json;
                            
                        } catch(error) {
                            // if(type === 'Textures') console.error(error.message.replace(/\n/g, ''));
                        }
                    });

                    resolve(type);
                }

                return true;
            });

            resolve(null);
        });
    }

    /**
     * Returns data about a Emote.
     * 
     * @param {String} EID ID of a emote.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getEID(EID, beautified=true) {
        if(!this.sorted.Emotes[EID]) return null;
        const Emote = this.sorted.Emotes[EID].exports[0];

        const Series = Emote.Series ? this.getSeries(Emote.Series.import) : null;
        const Set = Emote.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Backpack) : null;

        return !beautified ? {
            ...Emote,
            Animation: {
                Path: this.replaceStringName(Emote.Animation.asset_path_name),
                Cooldown: Emote.EmoteCooldownSecs
            },
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Character),
            id: EID,
            images: {
                small: Emote.SmallPreviewImage ? this.replaceStringName(Emote.SmallPreviewImage.asset_path_name) : null,
                large: Emote.LargePreviewImage ? this.replaceStringName(Emote.LargePreviewImage.asset_path_name) : null,
                displayAsset: Emote.DisplayAssetPath ? this.replaceStringName(Emote.DisplayAssetPath.asset_path_name) : null
            },
            animation: {
                male: this.replaceStringName(Emote.Animation.asset_path_name),
                female: Emote.AnimationFemaleOverride ? this.replaceStringName(Emote.AnimationFemaleOverride.asset_path_name) : null,
                cooldown: Emote.EmoteCooldownSecs
            }
        }
    }

    /**
     * Returns data about a Back Bling.
     * 
     * @param {String} BID ID of a Back Bling.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getBID(BID, beautified=true) {
        const id = Object.keys(this.sorted.Backpacks).find(c => c.toLowerCase() === BID.toLowerCase());
        if(!this.sorted.Backpacks[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Backpacks;

        const Backpack = exports[0];
        const Set = Backpack.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Backpack) : null;
        const Series = Backpack.Series ? this.getSeries(Backpack.Series.import) : null;

        const Meshes = [];
        const Parts = [];

        Backpack.CharacterParts.forEach((part) => {
            // console.log(partw)
        });
        
       return !beautified ? {
            ...Backpack,
            Parts,
            Meshes,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Backpack),
            images: {
                small: Backpack.SmallPreviewImage ? this.replaceStringName(Backpack.SmallPreviewImage.asset_path_name) : null,
                large: Backpack.LargePreviewImage ? this.replaceStringName(Backpack.LargePreviewImage.asset_path_name) : null,
                displayAsset: Backpack.DisplayAssetPath ? this.replaceStringName(Backpack.DisplayAssetPath.asset_path_name) : null
            },
            id,
            definition: {
                backbling: _path
            }
        };
    } 

    /**
     * Returns data about a Skin.
     * 
     * @param {String} CID ID of a skin.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getCID(CID, beautified=true) {
        const id = Object.keys(this.sorted.Characters).find(c => c.toLowerCase() === CID.toLowerCase());
        if(!this.sorted.Characters[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Characters;

        const Character = exports[0];
        const Hero = Object.keys(this.sorted.Heroes).find(h => this.sorted.Heroes[h].exports[0].export_index === Character.HeroDefinition.import);
        const HeroDefinition = this.sorted.Heroes[Hero].exports[0];
        const Set = Character.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Character) : null;

        const Specializations = this.sorted.Specializations[Object.keys(this.sorted.Specializations).find(s => s === HeroDefinition.Specializations[0].asset_path_name.split('/').pop().split('.')[0])].exports[0];
        const Meshes = [];
        const Parts = [];

        const Series = Character.Series ? this.getSeries(Character.Series.import) : null;

        Specializations.CharacterParts.forEach((part) => {
            const json = this.getJSON(this.replaceStringName(part.asset_path_name));
            if(json) {
                const path = this.replaceStringName(json.exports[1].SkeletalMesh.asset_path_name);

                if(json.exports) json.exports.forEach((exporte) => {
                    const { MaterialOverrides } = exporte;

                    if(!MaterialOverrides) return;

                    const { OverrideMaterial: { asset_path_name } } = MaterialOverrides[0];
                    const { TextureParameterValues } = this.getJSON(this.replaceStringName(asset_path_name).replace(/FortniteGame\/Content\//g, '')).exports[0];

                });
                
                if(json.exports) Meshes.push(json.exports);
                Parts.push(path);
            }
        });

        return !beautified ? {
            ...Character,
            HeroDefinition,
            Specializations,
            Parts,
            Meshes,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Character),
            images: {
                small: HeroDefinition.SmallPreviewImage ? this.replaceStringName(HeroDefinition.SmallPreviewImage.asset_path_name) : null,
                large: HeroDefinition.LargePreviewImage ? this.replaceStringName(HeroDefinition.LargePreviewImage.asset_path_name) : null,
                displayAsset: Character.DisplayAssetPath ? this.replaceStringName(Character.DisplayAssetPath.asset_path_name) : null
            },
            id,
            parts: {
                body: Parts[0],
                head: Parts[1]
            },
            definition: {
                hero: `FortniteGame/Content/Athena/Heroes/${Hero}.uasset`,
                character: _path
            }
        };
    }

    /**
     * Normal information like the name of the item.
     * 
     * @param Item Object of a Athena item.
     * @returns {Object}
     */
    getItemDefaultData(Item) {
        const Series = Item.Series ? this.getSeries(Item.Series.import) : null;
        const Set = Item.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSet(Item) : null;

        return {
            name: Item.DisplayName.string,
            description: Item.Description.string.trim(),
            gameplayTags: Item.GameplayTags.gameplay_tags,
            type: {
                display: Item.ShortDescription.string,
                value: Item.ShortDescription.string.toLowerCase(),
                shop: Item.GameplayTags.gameplay_tags.includes('Cosmetics.Source.ItemShop'),
            },
            rarity: {
                display: Item.Rarity,
                value: Item.Rarity.toLowerCase()
            },
            set: Set,
            series: Series
        }
    }

    /**
     * Get set information from a item.
     * 
     * @param Item Athena item export.
     * @returns {Object}
     */
    getSet(Item) {
        const Set = this.getSetObject(Item);

        return {
            name: Set.DisplayName.string,
            namespace: Set.DisplayName.string.namespace,
            tag: Set.Tag.TagName,
            description: Set.Description.string
        };
    }

    /**
     * Get raw information about a item's set.
     * 
     * @param Item An athena item export.
     */
    getSetObject(Item) {
        return this.sorted.Meta.CosmeticSets.exports[0][Item.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.'))];
    }

    /**
     * Get series information.
     * 
     * @param {String} import_index The import number from a Athena item object.
     * @returns {Object}
     */
    getSeries(import_index) {
        const Series = this.getSeriesObject(import_index);

        if(!Series) return null;

        return {
            background: Series.exports[0].BackgroundTexture ? this.replaceStringName(Series.exports[0].BackgroundTexture.asset_path_name) : null,
            card: Series.exports[0].ItemCardMaterial ? this.replaceStringName(Series.exports[0].ItemCardMaterial.asset_path_name) : null,
            material: Series.exports[0].BackgroundMaterial ? this.replaceStringName(Series.exports[0].BackgroundMaterial.asset_path_name) : null,
            name: Series.exports[0].DisplayName.string,
            colors: Series.exports[0].Colors
        }
    }

    /**
     * Get series object.
     * 
     * @param {String} import_index The import number from a Athena item object.
     */
    getSeriesObject(import_index) {
        return this.sorted.Series[Object.keys(this.sorted.Series).find(s => this.sorted.Series[s].exports[0].export_index === import_index)];
    }

    /**
     * Replaces and adds needed strings.
     * 
     * @param {String} name String.
     */
    replaceStringName(name) {
        return name.split('.')[0].replace('/Game', 'FortniteGame/Content') + '.uasset';
    }

    /**
     * Searches through all extractors and try to find the file and extract the JSON.
     * 
     * @returns Object
     */
    getJSON(file, extractor) {
        let json = null;

        Object.keys(this.extractors).map(e => this.extractors[e]).forEach((extractorr) => {
            if(extractor) extractorr = extractor;
            try {
                const Pak = new Package(extractorr.get_file(file));
                json._path = file;
                json = Pak.get_data();
            } catch(err) {
                // console.log(err);
            }
        });

        return json;
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