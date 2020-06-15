// (C) 2007-2020 GoodData Corporation
import { VisualizationProperties } from "@gooddata/sdk-model";
import { GdcVisualizationObject } from "@gooddata/gd-bear-model";
import { isUri } from "@gooddata/gd-bear-client";
import isArray = require("lodash/isArray");
import isObject = require("lodash/isObject");
import isString = require("lodash/isString");
import * as uuid from "uuid";

/*
 * Helpers
 */
const getReferenceValue = (id: string, references: GdcVisualizationObject.IReferenceItems) => references[id];
const getReferenceId = (value: string, references: GdcVisualizationObject.IReferenceItems) =>
    Object.keys(references).find(id => references[id] === value);

type IdGenerator = () => string;

const defaultIdGenerator: IdGenerator = () => uuid.v4().replace(/-/g, "");

type StringTransformation = (value: string) => string;

/**
 * Recursively traverses the object and tries to apply a conversion to every string value
 */
const traverse = (obj: any, convert: StringTransformation): any => {
    if (isArray(obj)) {
        return obj.map(a => traverse(a, convert));
    } else if (isObject(obj)) {
        return Object.keys(obj).reduce((result, key) => {
            result[key] = traverse((obj as any)[key], convert);
            return result;
        }, {} as any);
    } else if (isString(obj)) {
        return convert(obj);
    } else {
        return obj;
    }
};

export interface IConversionData {
    properties: VisualizationProperties;
    references: GdcVisualizationObject.IReferenceItems;
}

type ConversionFunction = (conversionData: IConversionData, idGenerator: IdGenerator) => IConversionData;

export type ReferenceConverter = (
    conversionData: IConversionData,
    idGenerator?: IdGenerator,
) => IConversionData;

const createConverter = (conversionFunction: ConversionFunction): ReferenceConverter => (
    conversionData,
    idGenerator = defaultIdGenerator,
) => {
    return conversionFunction(conversionData, idGenerator);
};

/*
 * Conversion from References to URIs
 */
const convertReferenceToUri = (
    references: GdcVisualizationObject.IReferenceItems,
): StringTransformation => value => getReferenceValue(value, references) || value;

/**
 * Converts URIs to reference based values
 *
 * @param conversionData Data to convert
 * @param [idGenerator=uuid] Function that returns unique ids
 *
 * @internal
 */
export const convertReferencesToUris = createConverter(({ references, properties }) => {
    return {
        properties: traverse(properties, convertReferenceToUri(references)),
        references,
    };
});

/*
 * Conversion from URIs to References
 */
const createUriToReferenceConverter = (
    originalReferences: GdcVisualizationObject.IReferenceItems,
    idGenerator: IdGenerator,
) => {
    const convertedReferences: GdcVisualizationObject.IReferenceItems = {};

    return {
        convertedReferences,
        conversion: (value: string) => {
            if (!isUri(value)) {
                return value;
            }

            const id =
                getReferenceId(value, originalReferences) || // try to reuse original references
                getReferenceId(value, convertedReferences) || // or use already converted new references
                idGenerator(); // or get a completely new id

            convertedReferences[id] = value;
            return id;
        },
    };
};

/**
 * Converts URIs to reference based values
 *
 * @param conversionData Data to convert
 * @param [idGenerator=uuid] Function that returns unique ids
 * @internal
 */
export const convertUrisToReferences = createConverter(({ properties, references }, idGenerator) => {
    const converter = createUriToReferenceConverter(references, idGenerator);

    return {
        properties: traverse(properties, converter.conversion),
        references: converter.convertedReferences,
    };
});
