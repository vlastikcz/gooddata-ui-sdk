// (C) 2019-2020 GoodData Corporation
import isEmpty from "lodash/isEmpty";
import { IGroupableCatalogItemBase } from "../group";
import { IMeasureMetadataObject } from "../../metadata/measure";

/**
 * Type representing catalog measure
 *
 * @public
 */
export interface ICatalogMeasure extends IGroupableCatalogItemBase {
    /**
     * Catalog item type
     */
    type: "measure";

    /**
     * Measure metadata object that catalog measure represents
     */
    measure: IMeasureMetadataObject;
}

/**
 * Type guard checking whether the provided object is a {@link ICatalogMeasure}
 *
 * @public
 */
export function isCatalogMeasure(obj: any): obj is ICatalogMeasure {
    return !isEmpty(obj) && (obj as ICatalogMeasure).type === "measure";
}
