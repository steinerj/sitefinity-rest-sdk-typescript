import { SdkItem } from './dto/sdk-item.js';
import { RestSdkTypes, RestClient } from './rest-client.js';

/**
 * Caches service metadata for one client and provides methods to access it.
 * It is used to fetch and store the metadata for the current Sitefinity CMS instance, including entity definitions and their properties.
 */
export class ServiceMetadata {
    private definition?: ServiceMetadataDefinition;
    private pending?: Promise<ServiceMetadataDefinition>;
    public serviceMetadataHash?: string;
    public taxonomies: SdkItem[] = [];

    constructor(private readonly client: RestClient) {}

    public get serviceMetadataCache(): ServiceMetadataDefinition {
        if (!this.definition) {
            throw new Error('Service metadata has not been loaded. Call await client.initialize() before querying content.');
        }
        return this.definition;
    }

    /**
     * Requests the content type metadata and initializes the service.
     * @returns {ServiceMetadataDefinition} The full types metadata definition.
     */
    public async fetch(metadataHash: string = '', traceContext?: any): Promise<ServiceMetadataDefinition> {
        while (this.pending) {
            await this.pending;
        }
        if (this.definition && metadataHash === this.serviceMetadataHash) {
            return this.definition;
        }
        const previousDefinition = this.definition;
        this.pending = (async () => {
            const metadataUrl = `${this.client.urls.getServerCmsServiceUrl()}/sfmeta${this.client.buildQueryParams()}`;
            const metadata = await this.client.sendRequest<ServiceMetadataDefinition>({ url: metadataUrl, traceContext });
            this.definition = metadata;
            try {
                const taxonomies = await this.client.getItems({ type: RestSdkTypes.Taxonomies, traceContext });
                this.taxonomies = taxonomies.Items;
                this.serviceMetadataHash = metadataHash;
                return metadata;
            } catch (error) {
                this.definition = previousDefinition;
                throw error;
            }
        })();
        try {
            return await this.pending;
        } finally {
            this.pending = undefined;
        }
    }

    /**
     * Gets the default field name for a given item type.
     * @param typeFullName The full type name of the item type.
     * @returns The default field name for the specified type.
     */
    public getDefaultFieldName(typeFullName: string): string {
        const entitySet = this.getSetNameFromType(typeFullName);
        if (entitySet) {
            const entityTypeDef = this.getEntityDefinition(entitySet);
            const defaultFieldPropName = 'Telerik.Sitefinity.V1.DefaultField';
            const propertiesPropName = 'properties';

            if (entityTypeDef.hasOwnProperty(defaultFieldPropName)) {
                return entityTypeDef[defaultFieldPropName];
            } else if (entityTypeDef.hasOwnProperty(propertiesPropName)) {
                const defaultFieldName = entityTypeDef[propertiesPropName][defaultFieldPropName];
                if (defaultFieldName) {
                    return defaultFieldName;
                }
            }
        }

        return 'Title';
    }

    /**
     * Gets the full type name for a given set name.
     * e.g. newsitems -> Telerik.Sitefinity.News.Model.NewsItem
     * @param itemType The full type name of the item type.
     * @returns The full type name for the specified set.
     */
    public getTypeNameFromSetName(itemType: string): string {
        const entitySet = this.serviceMetadataCache.entityContainer.entitySets[itemType];
        if (entitySet != null) {
            const entityTypeRef = entitySet.entityType['$ref'];
            return entityTypeRef.replace('#/definitions/', '');
        }

        return itemType;
    }

    /**
     * Gets the set name for a given item full type name.
     * e.g. Telerik.Sitefinity.News.Model.NewsItem -> newsitems
     * @param itemType The full type name of the item type.
     * @returns The set name for the specified type if such is matched.
     */
    public getSetNameFromType(itemType: string): string | undefined {
        const definition = this.serviceMetadataCache.definitions[itemType];
        if (definition != null) {
            const sets = this.serviceMetadataCache.entityContainer.entitySets;
            const setName = Object.keys(sets).find((x) => {
                return sets[x]['entityType']['$ref'].endsWith(itemType);
            });

            return setName;
        }

        return itemType;
    }

    /**
     * Gets the display name of a given item type by its full type name.
     * @param itemType The full type name of the item type.
     * @returns The display name of the item type if such is found.
     */
    public getModuleDisplayName(itemType: string): string {
        const definition = this.serviceMetadataCache.definitions[itemType];
        if (definition) {
            const displayName = definition['properties']['Telerik.Sitefinity.V1.DisplayName'];
            return displayName;
        }

        return '';
    }

    /**
     * Gets the current item's parent full type name.
     * @param itemType The child full type name.
     * @returns The parent item full type name.
     */
    public getParentType(itemType: string) {
        const definition = this.serviceMetadataCache.definitions[itemType];
        if (definition != null) {
            const parent = definition['properties']['Parent'];
            if (parent != null) {
                const anyOfProperty = parent['anyOf'] as Array<{ $ref: string }>;
                if (anyOfProperty != null && anyOfProperty.length > 0) {
                    let refProperty = anyOfProperty.find(x => x.$ref != null);
                    if (refProperty != null) {
                        return refProperty.$ref.replace('#/definitions/', '');
                    }
                }
            }
        }

        return null;
    }

    public getChildTypes(itemType: string): Array<Array<string>> {
        const result: Array<Array<string>> = [];
        const definition = this.serviceMetadataCache.definitions[itemType];
        if (definition != null) {
            const childTypes: Array<string> = definition['properties']['Telerik.Sitefinity.V1.ChildTypes'];
            if (childTypes != null) {
                result.push(childTypes);
                childTypes.forEach(childType => {
                    let grandChildTypes = this.getChildTypes(childType);
                    for (let i = 0; i < grandChildTypes.length; i++) {
                        let currentInheritanceLevel = result.at(i + 1);
                        if (currentInheritanceLevel != null) {
                            currentInheritanceLevel.push(...grandChildTypes[i]);
                        } else {
                            result.push(grandChildTypes[i]);
                        }

                    }
                });
            }
        }

        return result;
    }

    public isPropertyACollection(type: string, propName: string) {
        let entityTypeDef = this.serviceMetadataCache.definitions[type];
        let propMeta = entityTypeDef['properties'][propName];
        let propType = propMeta['type'];

        if (!propType) {
            return false;
        }

        return Array.isArray(propType) ? propType.includes('array') : propType === 'array';
    }

    /**
     * Gets a type's related data field's item type name.
     * @param type The full content type name.
     * @param relationName The related data field name.
     * @returns The related data type.
     */
    public getRelatedType(type: string, relationName: string): string | null {
        const typeDefinition = this.serviceMetadataCache.definitions[type];

        let properties = typeDefinition['properties'];
        let property = properties[relationName];
        if (typeof property !== 'object') {
            return null;
        }

        let relatedReferenceType = property['$ref'];
        if (relatedReferenceType == null) {
            let itemsProperty = property['items'];
            if (itemsProperty != null) {
                relatedReferenceType = itemsProperty['$ref'];
            }
        }

        if (relatedReferenceType == null) {
            let anyOfProperty: Array<any> = property['anyOf'];
            if (anyOfProperty && anyOfProperty.length > 0) {
                let relatedItemProperty = anyOfProperty.find(x => x['$ref'] != null);
                if (relatedItemProperty != null) {
                    relatedReferenceType = relatedItemProperty['$ref'];
                }
            }
        }

        if (relatedReferenceType == null) {
            return null;
        }

        const foundEntity = Object.values(this.serviceMetadataCache.entityContainer.entitySets).some(x => x['entityType']['$ref'] === relatedReferenceType);
        if (foundEntity) {
            return relatedReferenceType.replace('#/definitions/', '');
        }

        return null;
    }

    public serializeFilterValue(type: string, propName: string, value: any) {
        const definition = this.serviceMetadataCache.definitions[type];

        if (this.isPrimitiveProperty(type, propName)) {
            const propMeta = definition['properties'][propName];
            const propType = propMeta['type'];
            const propFormat = propMeta['format'];
            let propFormatToString = null;
            if (propFormat != null) {
                propFormatToString = propFormat.toString();
            }

            if (propType === null || propType === undefined) {
                return null;
            }

            const propTypeArray: string[] = Array.isArray(propType) ? propType : [propType];
            const propTypeString = propType.toString();

            if (value === null) {
                if (propTypeArray != null && propTypeArray.some(x => x === 'null')) {
                    return 'null';
                }

                return null;
            }

            if (propTypeString === 'array') {
                if (propMeta.items && propMeta.items.format) {
                    switch (propMeta.items.format) {
                        case 'string':
                            return `'${String(value).replace(/'/g, "''")}'`;
                        default:
                            return value.toString();
                    }
                }

                return null;
            } else if (propFormatToString === 'uuid') {
                return value.toString();
            } else if (propFormatToString === 'date-time') {
                if (value instanceof Date) {
                    return value.toISOString();
                } else if (!Number.isNaN(Date.parse(value))) {
                    return new Date(Date.parse(value)).toISOString();
                }

                return null;
            } else if (propTypeString === 'boolean' && (value instanceof Boolean || typeof value === 'boolean')) {
                return value.toString();
            } else if (propTypeArray.length > 0) {
                if (propTypeArray.some(x => x.toString() === 'number') || propTypeArray.some(x => x.toString() === 'boolean')) {
                    return value.toString();
                } else if (propTypeArray.some(x => x.toString() === 'string')) {
                    return `'${String(value).replace(/'/g, "''")}'`;
                }
            } else if (value != null) {
                return value.toString();
            }
        }

        return null;
    }

    /**
     * Gets the names of the properties of a given type that are not related types.
     * @param type The full type name of the item type.
     * @returns A collection of the names of the properties of the given type that are not related types.
     */
    public getSimpleFields(type: string): string[] {
        let definition = this.serviceMetadataCache.definitions[type];
        let propertiesObject = definition['properties'];

        return <string[]>Object.keys(propertiesObject).map((key) => {
            if (this.isPrimitiveProperty(type, key)) {
                return key;
            }

            return null;
        }).filter(x => !!x);
    }

    /**
     * Gets the names of the properties of a given type that are related types.
     * @param type The full type name of the item type.
     * @returns A collection of the names of the properties of the given type that are related types.
     */
    public getRelationFields(type: string): string[] {
        let definition = this.serviceMetadataCache.definitions[type];
        let propertiesObject = definition['properties'];

        return <string[]>Object.keys(propertiesObject).map((key) => {
            if (this.isRelatedProperty(type, key)) {
                return key;
            }

            return null;
        }).filter(x => !!x);
    }

    public getSelectedByDefaultFields(type: string): string[] {
        let definition = this.serviceMetadataCache.definitions[type];
        let propertiesObject = definition['properties'];

        return Object.keys(propertiesObject).filter((key) => {
            const fieldMeta = propertiesObject[key];
            return fieldMeta !== null && typeof fieldMeta === 'object' && fieldMeta['Telerik.Sitefinity.V1.SelectedByDefault'];
        });
    }

    /**
     * Gets the name of the taxonomy field for a given type by taxonomy name if such field exists on the type.
     * @param type The full type name of the item type.
     * @param taxonomyName The taxonomy name.
     * @returns The field name of the taxonomy field for the given type and taxonomy name if such field exists.
     */
    public getTaxonomyFieldName(type: string, taxonomyName: string): string | undefined {
        let definition = this.serviceMetadataCache.definitions[type];
        let propertiesObject = definition['properties'];
        return Object.keys(propertiesObject).find((key) => {
            const fieldMeta = propertiesObject[key];
            return fieldMeta['Telerik.Sitefinity.V1.Taxonomy'] === taxonomyName;
        });
    }

    /**
     * Gets the field type of a given property of a given type.
     * @param type The full type name of the item type.
     * @param propName The property name.
     * @returns {FieldType} The field type of the property.
     */
    public getFieldType(type: string, propName: string): FieldType {
        const definition = this.serviceMetadataCache.definitions[type];
        const propMeta = definition['properties'][propName];
        const fieldType = propMeta['Telerik.Sitefinity.V1.FieldType']?.toString();

        if (fieldType === 'ShortText' || fieldType === 'LongText') {
            return FieldType.TextField;
        } else if (fieldType === 'Choices' || fieldType === 'MultipleChoice') {
            return FieldType.ChoiceField;
        } else if (fieldType === 'Number') {
            return FieldType.NumberField;
        }

        const propFormat = propMeta['format']?.toString();
        if (propFormat === 'date-time') {
            return FieldType.DatetimeField;
        }

        const propType = propMeta['type'];
        if (propType) {
            const propTypeNumberArray = Array.isArray(propType);
            if (propTypeNumberArray) {
                const propAsArray = propType as string[];
                if (propAsArray.includes('number')) {
                    return FieldType.NumberField;
                } else if (propAsArray.includes('boolean')) {
                    return FieldType.BooleanField;
                } else if (propAsArray.includes('string')) {
                    return FieldType.TextField;
                }
            } else {
                if (propType === 'integer') {
                    return FieldType.NumberField;
                } else if (propType === 'boolean') {
                   return FieldType.BooleanField;
                } else if (propType === 'string') {
                    return FieldType.TextField;
                }
            }
        }

        let taxonomy = propMeta['Telerik.Sitefinity.V1.Taxonomy'];
        if (taxonomy && this.taxonomies.find(x => x.Name === taxonomy)) {
            return FieldType.ClassificationField;
        }

        return FieldType.TextField;
    }

    /**
     * Checks if a module is enabled in the service metadata.
     * @param moduleName The name of the module to check.
     * @returns True if the module is enabled, false otherwise.
     */
    public isModuleEnabled(moduleName: string): boolean {
        const modules = this.serviceMetadataCache?.modules;
        if (modules != null) {
            const moduleState = modules[moduleName];
            if (moduleState != null && typeof moduleState === 'boolean') {
                return moduleState;
            }
        }

        return false;
    }

    private getEntityDefinition(itemType : string) {
        const mainEntitySet = this.serviceMetadataCache.entityContainer.entitySets[itemType];

        if (!mainEntitySet) {
            throw new Error(`Could not find metadata for type ${itemType}`);
        }

        const entityTypeRef = mainEntitySet.entityType['$ref'];
        const entityTypeName = entityTypeRef.replace('#/definitions/', '');
        const entityTypeDef = this.serviceMetadataCache.definitions[entityTypeName];

        return entityTypeDef;
    }

    private isRelatedProperty(type: string, propName: string) {
        return !!this.getRelatedType(type, propName);
    }

    private isPrimitiveProperty(type: string, propName: string) {
        const definition = this.serviceMetadataCache.definitions[type];
        let properties = definition['properties'];
        let property = properties[propName];
        if (property == null) {
            throw new Error(`The field - ${propName} is not recognized as a property of the current type - ${type}`);
        }

        return (typeof property === 'object') && !this.isRelatedProperty(type, propName);
    }

}

export interface ServiceMetadataDefinition {
    definitions: { [key: string]: any };
    entityContainer: {
        entitySets: { [key: string] : any }
    };
    modules?: { [key: string]: boolean };
}

/**
 * FieldType is an enumeration that defines the different types of fields that can be found in the Sitefinity CMS.
 * It is used to identify the type of field for a given property in the content type metadata.
 */
export enum FieldType {
    /**
     * Represents a text field, which can be either short or long text.
     */
    TextField,

    /**
     * Represents a choice field, which can be either a single choice or multiple choices.
     */
    ChoiceField,

    /**
     * Represents a number field, which can be used for numeric values.
     */
    NumberField,

    /**
     * Represents a classification field, which is used for taxonomy fields.
     */
    ClassificationField,

    /**
     * Represents a date-time field, which is used for date and time values.
     */
    DatetimeField,

    /**
     * Represents a boolean field, which can be either true or false.
     */
    BooleanField
}
