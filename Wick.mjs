import nodeWick from 'node-wick';
import fs from 'fs';
import { UV_FS_O_FILEMAP } from 'constants';

const { Extractor, Package } = nodeWick;
const filter = (f) => f.endsWith('.ucas');

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
     * @param {Boolean} data.debug If debugging is enabled. (only works if log exists)
     */
    constructor(data={
        extract: true,
        chain: null,
        path: null,
        extractors: {},
        filter,
        log: console.log,
        debug: true
    }) {
        /**
         * Enable debugging.
         * 
         * @type Boolean
         */
        this.debugging = data.debug;

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
            Sprays: 'FortniteGame/Content/Athena/Items/Cosmetics/Sprays/',
            LoadingScreens: 'FortniteGame/Content/Athena/Items/Cosmetics/LoadingScreens/',
            Pickaxes: 'FortniteGame/Content/Athena/Items/Cosmetics/Pickaxes/',
            Weapons: 'FortniteGame/Content/Athena/Items/Weapons/',
            Ammo: 'FortniteGame/Content/Items/Ammo/AmmoData',
            Balance: 'FortniteGame/Content/Balance',
            Meta: 'FortniteGame/Content/Athena/Items/Cosmetics/Metadata/',
            Contrails: 'FortniteGame/Content/Athena/Items/Cosmetics/Contrails/',
            Wraps: 'FortniteGame/Content/Athena/Items/Cosmetics/ItemWraps/',
            Toys: 'FortniteGame/Content/Athena/Items/Cosmetics/Toys/',
            MusicPacks: 'FortniteGame/Content/Athena/Items/Cosmetics/MusicPacks/',
            Gliders: 'FortniteGame/Content/Athena/Items/Cosmetics/Gliders/',
            Banners: 'FortniteGame/Content/2dAssets/Banners/',
            Emojis: 'FortniteGame/Content/2dAssets/Emoji/',
            NpcItems: 'Plugins/GameFeatures/BattlepassS15/Content/Items/NpcItems/',
            NpcTables: 'Plugins/GameFeatures/BattlepassS15/Content/Balance/DataTables/',
            Quests: 'Plugins/GameFeatures/BattlepassS15/Content/Items/QuestItems/'
            // textures: 'FortniteGame/Content/Characters/Player/Female/Medium/Bodies/F_Med_Soldier_01/Skins/BR_01/Textures/'
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

        this.extraction = {};

        if(data.extract) {
            console.log('Auto extract has started an "extracted" property, wait for the property to become true.');
            console.log('You can always call the function and wait for the value to come back as that\'s easier.');
            this.extract();
        }
    }

    /**
     * Extracts a pak file.
     * 
     * @param file The pak file name.
     * @param keyer The key for the pak file.
     * 
     * @returns Object
     */
    async extract(file, keyer) {
        const path = this.path + file;
        return new Promise(async (resolve) => {
            const key = keyer || this.getKey(file) || this.chain.mainKey;

            const extractor = await new Promise((resolve) => {
                try {
                    resolve(new Extractor(path, key));
                } catch(err) {
                    if(this.log) this.log('\x1b[31m%s\x1b[0m', `Package ${file} failed using ${key}`);
                    resolve(null);
                    console.log(path)
                }
            });

            if(extractor) {
                if(this.extractors[file]) return;
                this.extractors[file] = extractor;

                const files = extractor.get_file_list();
                this.sort(files, extractor);

                if(this.log) this.log('\x1b[32m%s\x1b[0m', `Package ${file} worked with key ${key}: ${files.length} files`);

                resolve(true);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * Extracts all files in **directory** property defined in the *constructor*.
     * 
     * @returns Array
     */
    async extractAll() {
        await this.whiler(this.directory, (directory) => new Promise(async (resolve) => resolve(await this.extract(directory))));

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
        this.while(files, ((file) => {
            this.extraction[file] = extractor;
        }));

        // const textures = files.filter(e => e.includes('Textures/'));

        // if(textures[0]) this.exportTexture(textures[0].replace(/\.uasset/g, ''));

        return new Promise(async (resolve) => {
            await this.whiler(Object.keys(this.sorting), (type) => {
                const value = Array.isArray(this.sorting[type]) ? this.sorting[type][0] : this.sorting[type];
                const filtered = !Array.isArray(this.sorting[type]) ? files.filter(f => f.startsWith(value)) : files.filter(f => f.startsWith(value) && f.includes(this.sorting[type][1]));
                
                if(filtered.length > 3) {
                    if(!this.sorted[type]) this.sorted[type] = {};

                    this.while(filtered, ((f) => {
                        try {
                            const raw = extractor.get_file(f);
                            const data = new Package(raw);
                            const json = data.get_data();
                            if(json.exports[0]) {
                                json._path = f;
                                json._name = f.split('/').pop().split('.')[0];
                                this.sorted[type][type === 'NpcItems' ? f.split('/').pop().split('.')[0].split('TandemCharacterData_')[1] : f.split('/').pop().split('.')[0]] = json;
                            }
                        } catch(error) {
                            // console.error(error.message.replace(/\n/g, ''));
                        }
                    }));

                    resolve(type);
                }

                return true;
            });

            resolve(null);
        });
    }

    getEach(type='Tandem', beautified=true) {
        const name = `get${type}`;
        const sorting = this.getTypeSorting(type);

        if(!this[name]) return console.error(`Function *${name}* not found, please use a function name or short-hand name.`);
        else if(!sorting) console.error(`${name} is not in the sorting object!`);

        return Object.keys(sorting).map((id) => this[name](id, beautified));
    }

    getTypeSorting(type) {
        return {
            Tandem: this.sorted.NpcItems,
            Glider: this.sorted.Gliders,
            MusicPack: this.sorted.MusicPacks,
            Toy: this.sorted.Toys,
            Character: this.sorted.Characters
            // Glider: this.sorted.Gliders,
            // Glider: this.sorted.Gliders,
            // Glider: this.sorted.Gliders,
            // Glider: this.sorted.Gliders,
        }[type];
    }

    /**
     * Returns data about a Tandem.
     * 
     * @param {String} id Name of a Tandem.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getTandem(id, beautified=true) {
        if(!this.sorted.NpcItems[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.NpcItems;

        const Tandem = exports[0];
        const CID = Tandem.EntryListIcon.asset_path_name && Tandem.EntryListIcon.asset_path_name.split('HID')[1] && Tandem.EntryListIcon.asset_path_name.split('HID')[1].split('.')[0] ? "CID" + Tandem.EntryListIcon.asset_path_name.split('HID')[1].split('.')[0].split('-L')[0].replace(/-/g, '_') : null;

        const NPCServices = this.sorted.NpcTables.NPCServices.exports[0];
        const NPCQuests = this.sorted.NpcTables.NPCQuests.exports[0];
        const NPCSales = this.sorted.NpcTables.NPCSales.exports[0];
        const LootData = this.sorted.NpcTables.AthenaNPCBundleLootTierData_Client.exports[0];

        const Services = Object.keys(NPCServices).map((key) => NPCServices[key]).filter(service => service.NPC && service.NPC.TagName === Tandem.GameplayTag.TagName);
        const Quests = Object.keys(NPCQuests).map((key) => NPCQuests[key]).filter(service => service.NPC && service.NPC.TagName === Tandem.GameplayTag.TagName).map((quest) => quest.Quest ? this.sorted.Quests[quest.Quest.asset_path_name.split('.')[1]].exports[0] : null);
        const Sales = Object.keys(NPCSales).map((key) => NPCSales[key]).filter(service => service.NPC && service.NPC.TagName === Tandem.GameplayTag.TagName).map(sale => {
            return LootData[Object.keys(LootData).find(l => l.startsWith(sale.LootTier))];;
        });

        const SalesBeautified = Sales.map((sale) => {
            return {
                group: sale.TierGroup,
                weight: sale.Weight,
                quotaLevel: sale.QuotaLevel,
                loot: {
                    tier: sale.LootTier,
                    package: sale.LootPackage,
                    previewPackage: sale.LootPreviewPackage,
                    numPackageDrops: sale.NumLootPackageDrops,
                    packageCategoryWeightArray: sale.LootPackageCategoryWeightArray,
                    packageCategoryMinArray: sale.LootPackageCategoryMinArray,
                    packageCategoryMaxArray: sale.LootPackageCategoryMaxArray,
                    allowBonusDrops: sale.bAllowBonusLootDrops
                },
                streakBreaker: {
                    currency: sale.StreakBreakerCurrency,
                    pointsMin: sale.StreakBreakerPointsMin,
                    pointsMax: sale.StreakBreakerPointsMax,
                    pointsSpend: sale.StreakBreakerPointsSpend
                },
                gameplayTags: sale.GameplayTags.gameplay_tags ? sale.GameplayTags.gameplay_tags : null,
                requiredGameplayTags: sale.RequiredGameplayTags.gameplay_tags ? sale.RequiredGameplayTags.gameplay_tags : null,
                annotation: sale.Annotation ? sale.Annotation : null,
            }
        });

        return !beautified ? {
            ...Tandem,
            Character: this.getCharacter(CID, false),
            Services,
            Quests,
            Sales
        } : {
            ...this.getItemDefaultData(Tandem, true),
            description: {
                tandem: Tandem.AdditionalDescription ? Tandem.AdditionalDescription.string : null,
                general: Tandem.GeneralDescription ? Tandem.GeneralDescription.string : null
            },
            name: Tandem.DisplayName ? Tandem.DisplayName.string : null,
            tag: Tandem.GameplayTag ? Tandem.GameplayTag.TagName : null,
            meta: {
                hire: Services.find(service => service.ServiceTag.TagName === 'Tandem.Service.Hire') ? true : false,
                bounty: Services.find(service => service.ServiceTag.TagName === 'Tandem.Service.PlayerBounty') ? true : false,
            },
            id: CID,
            locations: Tandem.POILocations ? Tandem.POILocations.gameplay_tags : null,
            character: CID ? this.getCharacter(CID) : null,
            services: Services.map(service => {
                return {
                    chance: service.Chance,
                    priority: service.Priority,
                    tag: service.ServiceTag.TagName,
                    ...service.ServiceTag.TagName.includes('Tandem.Service.Sell') ? {
                        sale: SalesBeautified[Number(service.ServiceTag.TagName.split('Tandem.Service.Sell')[1]) - 1]
                    } : {}
                }
            }),
            sales: SalesBeautified,
            quests: Quests.map(quest => {
                return {
                    ...this.getItemDefaultData(quest, true),
                    rewards: quest.HiddenRewards.map(reward => {
                        return {
                            id: reward.TemplateId,
                            quantity: reward.Quantity
                        }
                    }),
                    categories: quest.bIncludedInCategories,
                    profileType: quest.GrantToProfileType,
                    expiration: quest.ExpirationDuration,
                    type: quest.QuestType,
                    description: quest.ShortDescription.string,
                    completion: {
                        text: quest.CompletionText.string
                    },
                    objectives: quest.Objectives.map(objective => {
                        return {
                            ...this.getItemDefaultData(objective, true),
                            alternativeStatHandles: objective.AlternativeStatHandles,
                            meta: {
                                hidden: objective.bHidden,
                                requirePrimaryMissionCompletion: objective.bRequirePrimaryMissionCompletion,
                                canProgressInZone: objective.bCanProgressInZone,
                                canProgressInZone: objective.bCanProgressInZone,
                                count: objective.Count,
                                dynamic: {
                                    statusUpdateType: objective.DynamicStatusUpdateType,
                                    statusUpdatePercentInterval: objective.DynamicStatusUpdatePercentInterval,
                                    updateCompletionDelay: objective.DynamicUpdateCompletionDelay,
                                    displayAnnouncementUpdate: objective.bDisplayDynamicAnnouncementUpdate
                                },
                                itemEvent: objective.ItemEvent,
                                itemTemplateIdOverride: objective.ItemTemplateIdOverride,
                                link: {
                                    squadID: objective.LinkSquadID,
                                    squadIndex: objective.LinkSquadIndex,
                                    itemManagement: objective.LinkToItemManagement,
                                    linkVaultTab: objective.LinkVaultTab
                                },
                                stage: objective.Stage
                            },
                            backendName: objective.BackendName,
                            stats: objective.InlineObjectiveStats.map(stat => {
                                return {
                                    meta: {
                                        inclusive: {
                                            hasContextTags: stat.bHasInclusiveContextTags,
                                            hasSourceTags: stat.bHasInclusiveSourceTags,
                                            hasTargetTags: stat.bHasInclusiveTargetTags
                                        },
                                        templateIds: stat.TemplateIds,
                                    },
                                    condition: stat.Condition,
                                    type: stat.Type,
                                    conditions: stat.TagConditions.map(condition => {
                                        return {
                                            tag: condition.Tag ? condition.Tag.TagName : null,
                                            type: condition.Type ? condition.Type : null,
                                            required: condition.Require ? condition.Require : null,
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    }

    /**
     * Returns data about a Glider.
     * 
     * (Not case sensitive)
     * 
     * @param {String} GID ID of a Glider.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getGlider(GID, beautified=true) {
        const id = Object.keys(this.sorted.Gliders).find(c => c.toLowerCase() === GID.toLowerCase());
        if(!this.sorted.Gliders[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Gliders;

        const Glider = exports[0];
        const Set = Glider.GameplayTags ? Glider.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Glider) : null : null;
        const Series = Glider.Series ? this.getSeries(Glider.Series.import) : null;

       return !beautified ? {
            ...Glider,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Glider),
            id,
            definition: {
                glider: _path
            },
            sounds: {
                open: Glider.OpenSound ? this.replaceStringName(Glider.OpenSound.asset_path_name) : null,
                close: Glider.CloseSound ? this.replaceStringName(Glider.CloseSound.asset_path_name) : null,
            }
        };
    }

    /**
     * Returns data about a Music Pack.
     * 
     * (Not case sensitive)
     * 
     * @param {String} MID ID of a Music Pack.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getMusicPack(MID, beautified=true) {
        const id = Object.keys(this.sorted.MusicPacks).find(c => c.toLowerCase() === MID.toLowerCase());
        if(!this.sorted.MusicPacks[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.MusicPacks;

        const MusicPack = exports[0];
        const Set = MusicPack.GameplayTags ? MusicPack.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(MusicPack) : null : null;
        const Series = MusicPack.Series ? this.getSeries(MusicPack.Series.import) : null;

       return !beautified ? {
            ...MusicPack,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(MusicPack),
            id,
            definition: {
                musicPack: _path
            },
            sound: MusicPack.FrontEndLobbyMusic ? this.replaceStringName(MusicPack.FrontEndLobbyMusic.asset_path_name) : null
        };
    }

    /**
     * Returns data about a Toy.
     * 
     * (Not case sensitive)
     * 
     * @param {String} TYID ID of a Toy.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getToy(TYID, beautified=true) {
        const id = Object.keys(this.sorted.Toys).find(c => c.toLowerCase() === TYID.toLowerCase());
        if(!this.sorted.Toys[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Toys;

        const Toy = exports[0];
        const Set = Toy.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Toy) : null;
        const Series = Toy.Series ? this.getSeries(Toy.Series.import) : null;

       return !beautified ? {
            ...Toy,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Toy),
            id,
            definition: {
                toy: _path
            },
            animation: {
                male: this.replaceStringName(Toy.Animation.asset_path_name),
                cooldown: Toy.EmoteCooldownSecs
            }
        };
    }

    /**
     * Returns data about a Wrap.
     * 
     * (Not case sensitive)
     * 
     * @param {String} WID ID of a Wrap.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getWrap(WID, beautified=true) {
        const id = Object.keys(this.sorted.Wraps).find(c => c.toLowerCase() === WID.toLowerCase());
        if(!this.sorted.Wraps[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Wraps;

        const Wrap = exports[0];
        const Set = Wrap.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Wrap) : null;
        const Series = Wrap.Series ? this.getSeries(Wrap.Series.import) : null;

       return !beautified ? {
            ...Wrap,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Wrap),
            id,
            definition: {
                wrap: _path
            }
        };
    }

    /**
     * Returns data about a Emote.
     * 
     * (Not case sensitive)
     * 
     * @param {String} EID ID of a emote.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getEmote(EID, beautified=true) {
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
     * Returns data about a Pickaxe.
     * 
     * (Not case sensitive)
     * 
     * @param {String} PID ID of a Pickaxe.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getPickaxeID(PID, beautified=true) {
        const id = Object.keys(this.sorted.Pickaxes).find(c => c.toLowerCase() === PID.toLowerCase());
        if(!this.sorted.Pickaxes[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Pickaxes;

        const Pickaxe = exports[0];
        const Set = Pickaxe.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Pickaxe) : null;
        const Series = Pickaxe.Series ? this.getSeries(Pickaxe.Series.import) : null;

        /* const WeaponDefinition = this.sorted.Weapons; */
        
        return !beautified ? {
            ...Pickaxe,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Pickaxe),
            images: {
                small: Pickaxe.SmallPreviewImage ? this.replaceStringName(Pickaxe.SmallPreviewImage.asset_path_name) : null,
                large: Pickaxe.LargePreviewImage ? this.replaceStringName(Pickaxe.LargePreviewImage.asset_path_name) : null,
                displayAsset: Pickaxe.DisplayAssetPath ? this.replaceStringName(Pickaxe.DisplayAssetPath.asset_path_name) : null
            },
            id,
            definition: {
                pickaxe: _path
            }
        };
    }

    /**
     * Get weapon.
     * 
     * (Not case sensitive)
     * 
     * @param {Object} id Weapon ID.
     * @returns {Object}
     */
    getWeapon(id, beautified=true) {
        id = Object.keys(this.sorted.Weapons).find(c => c.toLowerCase() === id.toLowerCase());
        if(!this.sorted.Weapons[id]) return null;

        const { [id]: { exports, imported_packages, _name } } = this.sorted.Weapons;

        const Weapon = exports[0];

        const { exports: AmmoExports, _name: ammoID } = this.sorted.Ammo[Weapon.AmmoData.asset_path_name.split('.')[1].replace(/Athena/, '')];

        const Ammo = AmmoExports[0];

        return !beautified ? {
            ...Weapon,
            Ammo
        } : {
            ...this.getItemDefaultData(Weapon),
            sounds: {
                drop: Weapon.DropSound ? this.replaceStringName(Weapon.DropSound.asset_path_name) : null,
                pickup: Weapon.PickupSound ? this.replaceStringName(Weapon.PickupSound.asset_path_name) : null,
                landed: Weapon.LandedSound ? this.replaceStringName(Weapon.LandedSound.asset_path_name) : null
            },
            meta: {
                alwaysCountForCollectionQuest: Weapon.bAlwaysCountForCollectionQuest,
                canBeStolen: Weapon.bItemCanBeStolen,
                HasDurability: Weapon.bItemHasDurability,
                should: {
                    usePerfectAimWhenTargetingMinSpread: Weapon.bShouldUsePerfectAimWhenTargetingMinSpread,
                    spawnBulletShellFX: Weapon.bShouldSpawnBulletShellFX
                },
                showDirectionalArrowWhenFarOff: Weapon.bShowDirectionalArrowWhenFarOff,
                targetingPreventsReload: Weapon.bTargetingPreventsReload,
                traceThroughPawns: Weapon.bTraceThroughPawns,
                preventDefaultPreload: Weapon.bPreventDefaultPreload,
                neverPersisted: Weapon.bNeverPersisted,
                showReticleHitNotifyAtImpactLocation: Weapon.bShowReticleHitNotifyAtImpactLocation,
                showReticleHitNotifyAtImpactLocation: Weapon.bShowReticleHitNotifyAtImpactLocation,
            },
            tier: Weapon.Tier,
            searchTags: Weapon.SearchTags ? Weapon.SearchTags.string.split(' ') : null,
            type: {
                display: Weapon.SearchTags ? Weapon.SearchTags.string.split(' ')[0].slice(0, -1) : null,
                value: Weapon.SearchTags ? Weapon.SearchTags.string.split(' ')[0].slice(0, -1).toLowerCase() : null
            },
            ammo: {
                ...this.getItemDefaultData(Ammo, true),
                images: this.getImages(Ammo),
                sounds: {
                    drop: Ammo.DropSound ? this.replaceStringName(Ammo.DropSound.asset_path_name) : null,
                    pickup: Ammo.PickupSound ? this.replaceStringName(Ammo.PickupSound.asset_path_name) : null,
                    landed: Ammo.LandedSound ? this.replaceStringName(Ammo.LandedSound.asset_path_name) : null
                },
                max: Ammo.MaxStackSize.Value,
                type: {
                    display: 'Ammo',
                    value: 'ammo'
                },
                id: ammoID,
                name: Ammo.DisplayName.string.split('Ammo: ')[1],
                dropCount: Ammo.DropCount,
                meta: {
                    showDirectionalArrowWhenFarOff: Ammo.bShowDirectionalArrowWhenFarOff,
                    supportsQuickbarFocus: Ammo.bSupportsQuickbarFocus,
                    triggersFeedbackLines: Ammo.bTriggersFeedbackLines
                },
                searchTags: Ammo.SearchTags ? Ammo.SearchTags.string.split(' ') : null,
            },
            actualAnalyticNames: Weapon.ActualAnalyticFNames,
            analyticTags: Weapon.AnalyticTags.gameplay_tags,
            id: _name,
            creativeTagsHelper: Weapon.CreativeTagsHelper ? Weapon.CreativeTagsHelper.CreativeTags : null
        }
    }

    /**
     * Returns data about a Back Pack.
     * 
     * (Not case sensitive)
     * 
     * @param {String} BID ID of a Back Pack.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getBackPack(BID, beautified=true) {
        const id = Object.keys(this.sorted.Backpacks).find(c => c.toLowerCase() === BID.toLowerCase());
        if(!this.sorted.Backpacks[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Backpacks;

        const Backpack = exports[0];
        const Set = Backpack.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Backpack) : null;
        const Series = Backpack.Series ? this.getSeries(Backpack.Series.import) : null;

        const Meshes = [];
        const Parts = [];

        Backpack.CharacterParts.forEach((part) => {
            /* console.log(partw) */
        });
        
       return !beautified ? {
            ...Backpack,
            Parts,
            Meshes,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Backpack),
            id,
            definition: {
                backbling: _path
            }
        };
    }

    /**
     * Returns data about a Spray.
     * 
     * (Not case sensitive)
     * 
     * @param {String} SPID ID of a Spray.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getSpray(SPID, beautified=true) {
        const id = Object.keys(this.sorted.Sprays).find(c => c.toLowerCase() === SPID.toLowerCase());
        if(!this.sorted.Sprays[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Sprays;

        const Spray = exports[0];
        const Set = Spray.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Spray) : null;
        const Series = Spray.Series ? this.getSeries(Spray.Series.import) : null;

       return !beautified ? {
            ...Spray,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Spray),
            id,
            definition: {
                spray: _path,
                material: Spray.DecalMaterial ? this.replaceStringName(Spray.DecalMaterial.asset_path_name) : null
            }
        };
    }

    /**
     * Get Loading Screen by ID.
     * 
     * (Not case sensitive)
     * 
     * @param LSID The ID of a Loading Screen.
     * @param beautified If the returned json looks good or not.
     * @returns Object
     */
    getLoadingScreen(LSID, beautified=true) {
        const id = Object.keys(this.sorted.LoadingScreens).find(c => c.toLowerCase() === LSID.toLowerCase());
        if(!this.sorted.LoadingScreens[id]) return null;

        const { [id]: { exports, imported_packages, export_type, _path } } = this.sorted.LoadingScreens;

        const LoadingScreen = exports[0];
        const Set = LoadingScreen.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(LoadingScreen) : null;
        const Series = LoadingScreen.Series ? this.getSeries(LoadingScreen.Series.import) : null;

       return !beautified ? {
            ...LoadingScreen,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(LoadingScreen),
            id,
            definition: {
                loadingscreen: _path
            },
            type: {
                display: 'Loading Screen',
                value: 'loading screen',
                definition: export_type
            }
        };
    }

    /**
     * Get Contrail by ID.
     * 
     * (Not case sensitive)
     * 
     * @param TID The ID of a Contrail.
     * @param beautified If the returned json looks good or not.
     * @returns Object
     */
    getContrail(TID, beautified=true) {
        const id = Object.keys(this.sorted.Contrails).find(c => c.toLowerCase() === TID.toLowerCase());
        if(!this.sorted.Contrails[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Contrails;

        const Contrail = exports[0];
        const Set = Contrail.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Contrail) : null;
        const Series = Contrail.Series ? this.getSeries(Contrail.Series.import) : null;

       return !beautified ? {
            ...Contrail,
            Series,
            Set
        } : {
            ...this.getItemDefaultData(Contrail),
            id,
            definition: {
                contrail: _path
            }
        };
    }

    debug(text, ...extra) {
        if(!this.log || !this.debugging) return;
        return this.log('\x1b[34m[\x1b[36mDEBUG\x1b[34m]', `\x1b[37m${text}\x1b[34m`, ...extra);
    }

    getTextures(exporte, type) {
        let Material = null;
        let asset_path_name = null;

        if(!type) return;

        if(type.includes('BodyPart')) {
            const { MaterialOverrides } = exporte;

            if(!MaterialOverrides) return;
            asset_path_name = MaterialOverrides[0].OverrideMaterial.asset_path_name;
    
            Material = this.exportObject(this.replaceStringName(asset_path_name).replace(/FortniteGame\/Content\//g, ''));
        } else if(type.includes('HeadData') || type.includes('CharacterPart')) {
            const { SkeletalMesh } = exporte;

            if(!SkeletalMesh) return;

            asset_path_name = SkeletalMesh.asset_path_name.replace(/\/Game\//g, 'FortniteGame/Content/').replace(/Meshes/, 'Materials').replace(/Mesh/, 'Materials').split('.')[0] + '.uasset';

            Material = this.exportObject(asset_path_name);
        }
        
        if(!Material || !Material.exports) return;

        const TextureParameterValues = Material.exports[0].TextureParameterValues;
        if(!TextureParameterValues) return;

        const Textures = {};

        let pathPattern = null;

        TextureParameterValues.forEach((parameterValue) => {
            const Name = parameterValue.ParameterInfo.Name;

            const type = Name === 'M' ? 'M' : Name === 'Diffuse' ? 'D' : Name === 'Normals' ? 'N' : Name === 'SpecularMasks' ? 'S' : Name === 'SkinFX_Mask' ? 'FX' : null;
            const path = Material._path.replace(/Materials\//, 'Textures/').replace(/\.uasset/, `_${type}`);

            if(!this.extraction[path + '.uasset'] && type) {
                this.debug('Texture fallback started.', 'getCharacter, starts at line 898.');

                const textureStart = Material._path.replace(/Materials\//, 'Textures/');

                if(pathPattern) {
                    Textures[type] = pathPattern + `_${type}.uasset`;
                } else {
                    const TBD = [
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, '').replace(/_Body/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, '').replace(/_Body/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_${type}`).replace(/_Commando/, '').replace(/_Body/, ''),
                        textureStart.replace(/\.uasset/, `_${type}`).replace(/_Commando/, '').replace(/_Body/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, '').replace(/_Body/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, '').replace(/_Body/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, ''),
                        textureStart.replace(/\.uasset/, `_01_${type}`).replace(/_Commando/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_${type}`).replace(/_Commando/, ''),
                        textureStart.replace(/\.uasset/, `_${type}`).replace(/_Commando/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_${type}`),
                        textureStart.replace(/\.uasset/, `_${type}`).replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, '').replace(/_Body/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, '').replace(/_Body/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, '').replace(/_Body/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, '').replace(/_Body/, '').replace(/_MED/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, ''),
                        textureStart.replace(/\.uasset/, `_02_${type.toLowerCase()}`).replace(/_Commando/, '').replace(/_MED/, '')
                    ];
    
                    this.while(TBD, (texture) => {
                        const pather = texture.split('Textures/')[1] ? texture.split('Textures/')[0] + 'Textures/' + texture.split('Textures/')[1].replace(texture.split('Textures/')[1].charAt(0), "T") + '.uasset' : null;
                        if(this.extraction[pather] || this.extraction[texture + '.uasset']) {
                            Textures[type] = this.extraction[pather] ? pather : texture + '.uasset';
    
                            pathPattern = (this.extraction[pather] ? pather : texture + '.uasset').split(`_${type}.uasset`)[0];
                        }
                    });
                }

                if(!Object.keys(Textures)[0]) this.debug('Texture fallback failed.', 'getCharacter, starts at line \x1b[37m898\x1b[34m.', '\x1b[36mtags:', 'fallback for textures', 'failing', 'textures', 'error', 'fail', 'exception', 'fallback', 'character', 'function', 'line 898');
                return;
            }

            Textures[type] = path;
        });

        return Textures;
    }

    getPartType(export_type) {
        if(!export_type) return null;

        return export_type.includes('BodyPart') ? 'Body' : export_type.includes('HeadData') ? 'Head' : export_type.includes('CharacterPart') ? 'Head' : export_type.includes('FaceData') || export_type.includes('Hats/') ? 'Accessory' : null;
    }

    fileExists(file) {
        return this.extraction[file] ? true : false;
    }

    /**
     * Returns data about a Character.
     * 
     * (Not case sensitive)
     * 
     * @param {String} CID ID of a Character.
     * @param {Boolean} beautified If the returned data is beautified or not.
     * @returns Object
     */
    getCharacter(CID, beautified=true) {
        const id = Object.keys(this.sorted.Characters).find(c => c.toLowerCase() === CID.toLowerCase());
        if(!this.sorted.Characters[id]) return null;

        const { [id]: { exports, imported_packages, _path } } = this.sorted.Characters;

        const Character = exports[0];

        if(!Character.HeroDefinition) return null;
        const Hero = Object.keys(this.sorted.Heroes).find(h => this.sorted.Heroes[h].exports[0].export_index === Character.HeroDefinition.import);
        const HeroDefinition = this.sorted.Heroes[Hero].exports[0];
        const Set = Character.GameplayTags ? Character.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSetObject(Character) : null : null;

        const Specializations = this.sorted.Specializations[Object.keys(this.sorted.Specializations).find(s => s === HeroDefinition.Specializations[0].asset_path_name.split('/').pop().split('.')[0])].exports[0];
        const Meshes = [];

        const Series = Character.Series ? this.getSeries(Character.Series.import) : null;

        const Parts = {
            body: {
                mesh: null,
                textures: [],
                parts: []
            },
            head: {
                mesh: null,
                textures: [],
                parts: []
            }
        }

        let Gender = null;
        let Size = null;

        Specializations.CharacterParts.forEach((part) => {
            const json = this.exportObject(this.replaceStringName(part.asset_path_name)) || this.exportObject(this.replaceStringName(part.asset_path_name).split('FortniteGame/Content/')[1]);

            if(json) { /** If the exported object does exist. */
                if(json.exports && json.exports[0]) {
                    const export_type = json.exports[0].export_type;
                    const type = this.getPartType(export_type);
 
                    switch(type) {
                        case 'Body': {
                            Gender = json.exports[1].GenderPermitted;
                            Size = json.exports[1].BodyTypesPermitted;
    
                            Parts.body.mesh = this.replaceStringName(json.exports[1].SkeletalMesh ? json.exports[1].SkeletalMesh.asset_path_name : json.exports[0].AnimClass.asset_path_name.replace(/_AnimBP/g, '').replace(/_Skeleton_AnimBlueprint/g, ''));
                            Parts.body.textures = this.getTextures(json.exports[1], export_type);
                        } break;

                        case 'Head': {
                            Parts.head.mesh = this.replaceStringName(json.exports[1].SkeletalMesh ? json.exports[1].SkeletalMesh.asset_path_name : json.exports[0].AnimClass.asset_path_name.replace(/_AnimBP/g, '').replace(/_Skeleton_AnimBlueprint/g, ''));
                            Parts.head.textures = this.getTextures(json.exports[1], export_type);
                        } break;

                        case 'Accessory': {
                            /** Get accessory. */
                            const accessory = this.exportObject(this.fileExists(this.replaceStringName(part.asset_path_name)) ? this.replaceStringName(part.asset_path_name) : this.fileExists(this.replaceStringName(part.asset_path_name).split('FortniteGame/Content/')[1]) ? this.replaceStringName(part.asset_path_name).split('FortniteGame/Content/')[1] : null);
                            const accessoryType = part.asset_path_name.includes('FaceAccessories') || part.asset_path_name.includes('Heads/') ? 'head' : part.asset_path_name.includes('Hats/') ? 'body' : null;
                            
                            if(accessoryType) {
                                Parts[accessoryType].parts.push({
                                    data: accessory._path,
                                    type: accessory.exports[1].CharacterPartType,
                                    attachedToSocket: accessory.exports[1].bAttachToSocket,
                                    mesh: accessory.exports[1].SkeletalMesh ? this.replaceStringName(accessory.exports[1].SkeletalMesh.asset_path_name) : null,
                                    animation: {
                                        blueprint: accessory.exports[0].AnimClass ? this.replaceStringName(accessory.exports[0].AnimClass.asset_path_name) : null
                                    },
                                    index: Number(accessory.exports[0].export_index),
                                    textures: []
                                });

                            } else if(this.log) this.log(`Unknown Accessory type: ${part.asset_path_name}`);
                        } break;

                        default: {
                            if(this.log) this.log(`Unknown Part type: ${type}`, json);
                        } break;
                    }
                }
                
                if(json.exports) Meshes.push(json.exports);
            } else {
                /** Determine if part is a specific type. */
                const type = part.asset_path_name.includes('Bodies/') ? 'body' : part.asset_path_name.includes('Heads/') ? 'head' : part.asset_path_name.includes('FaceAcc') ? 'Accessory' : null;
                const path = this.fileExists(this.replaceStringName(part.asset_path_name)) ? this.replaceStringName(part.asset_path_name) : this.fileExists(this.replaceStringName(part.asset_path_name).split('FortniteGame/Content/')[1]) ? this.replaceStringName(part.asset_path_name).split('FortniteGame/Content/')[1] : null;

                if(type) {
                    if(type === 'Accessory') {
                    }
                    else Parts[type].mesh = path;
                } else if(this.log) this.log(`Unknown asset type on fallback: ${part.asset_path_name}`);
            }
        });

        return !beautified ? {
            ...Character,
            HeroDefinition,
            Specializations,
            Parts,
            Meshes,
            Series,
            Set,
            Size,
            Gender
        } : {
            ...this.getItemDefaultData(Character),
            id,
            definition: {
                hero: `FortniteGame/Content/Athena/Heroes/${Hero}.uasset`,
                character: _path
            },
            gender: Gender,
            size: Size,
            parts: Parts
        };
    }

    /**
     * Returns images.
     * 
     * @param O A type of Object.
     * @returns {Object}
     */
    getImages(O) {
        return {
            small: O.SmallPreviewImage ? this.replaceStringName(O.SmallPreviewImage.asset_path_name) : null,
            hudAmmoSmallPreview: O.HUDAmmoSmallPreviewImage ? this.replaceStringName(O.HUDAmmoSmallPreviewImage.asset_path_name) : null,
            large: O.LargePreviewImage ? this.replaceStringName(O.LargePreviewImage.asset_path_name) : null,
            displayAsset: O.DisplayAssetPath ? this.replaceStringName(O.DisplayAssetPath.asset_path_name) : null,
            decal: O.DecalTexture ? O.DecalTexture.asset_path_name : null,
            background: O.BackgroundImage ? this.replaceStringName(O.BackgroundImage.asset_path_name) : null,
            cover: O.CoverArtImage ? this.replaceStringName(O.CoverArtImage.asset_path_name) : null,
            toast: O.ToastIcon ? this.replaceStringName(O.ToastIcon.asset_path_name) : null,
            entryList: O.EntryListIcon ? this.replaceStringName(O.EntryListIcon.asset_path_name) : null,
            sidePanelIcon: O.SidePanelIcon ? this.replaceStringName(O.SidePanelIcon.asset_path_name) : null
        }
    }

    /**
     * Normal information like the name of the item.
     * 
     * (Not case sensitive)
     * 
     * @param Item Object of a Athena item.
     * @returns {Object}
     */
    getItemDefaultData(Item, hideExtra) {
        const Series = Item.Series ? this.getSeries(Item.Series.import) : null;
        const Set = Item.GameplayTags ? Item.GameplayTags.gameplay_tags.find(tag => tag.includes('Cosmetics.Set.')) ? this.getSet(Item) : null : null;
        const ShortDescription = Item.ShortDescription || Item.Description;

        return {
            images: this.getImages(Item),
            description: Item.Description ? Item.Description.string.trim() : null,
            gameplayTags: Item.GameplayTags ? Item.GameplayTags.gameplay_tags : null,
            ...hideExtra ? {
                type: Item.export_type
            } : {
                type: {
                    display: ShortDescription ? ShortDescription.string : null,
                    value: ShortDescription ? ShortDescription.string.toLowerCase() : null,
                    shop: Item.GameplayTags ? Item.GameplayTags.gameplay_tags.includes('Cosmetics.Source.ItemShop') : null,
                },
                rarity: {
                    display: Item.Rarity,
                    value: Item.Rarity ? Item.Rarity.toLowerCase() : null,
                    backend: `EFortRarity::${Item.Rarity}`,
                    definition: Item.export_type
                },
                set: Set,
                series: Series,
                name: Item.DisplayName ? Item.DisplayName.string : null
            }
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

        if(!Set) return null;

        return {
            name: Set.DisplayName ? Set.DisplayName.string : null,
            namespace: Set.DisplayName ? Set.DisplayName.string.namespace : null,
            tag: Set.Tag ? Set.Tag.TagName : null,
            description: Set.Description ? Set.Description.string : null
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

    getPackage(data, secondary) {
        return new Package(data, secondary);
    }

    /**
     * Exports the file's object, by using the `wick.extraction` object full of paths.
     * 
     * @returns Object
     */
    exportObject(file, extractor) {
        if(!extractor) extractor = this.extraction[file];
        if(!extractor) return null;

        try {
            const Pak = this.getPackage(extractor.get_file(file));
            const json = Pak.get_data();
            json._path = file;
    
            return json;
        } catch(err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Exports the file's texture, by using the `wick.extraction` object full of paths.
     * 
     * @returns Buffer
     */
    exportTexture(file, json=true, extractor) {
        const main = file + '.uasset';

        if(!extractor) extractor = this.extraction[main];
        if(!extractor) return null;

        const files = extractor.get_file_list().toString();

        const type = files.includes(file + '.uptnl') ? 'uptnl' : files.includes(file + '.ubulk') ? 'ubulk' : null;

        const secondary = type ? extractor.get_file(file + `.${type}`) : null;

        const Pak = this.getPackage(extractor.get_file(main), secondary);
        const texture = json ? Pak.get_data() : Pak.get_texture();
        texture._path = file;

        return texture;
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
     * forEach function using *while*.
     * 
     * @param {(Object|Array)} array To be looped.
     * @param {Function} func Function on each element.
     * @param {Boolean} keys If param *array* is a Object.
     */
    while(array, func, keys=false) {
        let length = keys ? Object.keys(array).length : array.length;
        
        while(length--) func(keys ? Object.keys(array)[length] : array[length], length);
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