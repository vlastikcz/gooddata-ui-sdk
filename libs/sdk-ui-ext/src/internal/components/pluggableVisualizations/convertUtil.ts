// (C) 2020 GoodData Corporation
import isEmpty from "lodash/isEmpty";

// import { GdcVisualizationObject } from "@gooddata/api-model-bear";
// TODO: import ^
function isAttribute(bucketItem: any): bucketItem is IAttribute {
    return !isEmpty(bucketItem) && (bucketItem as any).visualizationAttribute !== undefined;
}

type IVisualization = any;
type IAttribute = any;
type IBucket = any;

type IImplicitDrillDown = any;

function matchesDrillDownTargetAttribute(drillConfig: IImplicitDrillDown, attribute: IAttribute) {
    const drillSourceLocalIdentifier = drillConfig.implicitDrillDown.from.drillFromAttribute.localIdentifier;
    return attribute.visualizationAttribute.localIdentifier === drillSourceLocalIdentifier;
}

type TColumnWidths = {
    attributeColumnWidthItem?: {
        attributeIdentifier: string;
        width: {
            value: number;
        };
    };
    measureColumnWidthItem?: {
        width: {
            value: number;
        };
    };
};

type TControls = {
    columnWidths: TColumnWidths[];
};

type TSortItems = {
    attributeSortItem?: {
        attributeIdentifier: string;
        direction: string;
    };
    measureSortItem?: {
        direction: string;
        locators: string[];
    };
};

interface IRemovedAttribute {
    visualizationAttribute: {
        localIdentifier: string;
        displayForm: {
            uri: string;
        };
    };
}

interface IVisualizationProperties {
    controls?: TControls[];
    sortItems?: TSortItems[];
}

enum ENUM_PROPERTIES_TYPE {
    CONTROLS = "controls",
}

enum ENUM_BUCKETS_TYPE {
    ATTRIBUTE = "attribute",
    ROLLUP_TOTAL = "nat",
}

export function removeAttributesFromBuckets(
    sourceVisualization: IVisualization,
    drillConfig: IImplicitDrillDown,
) {
    const modifiedBuckets: IBucket[] = [];
    const removedItems: IRemovedAttribute[] = [];

    sourceVisualization.visualizationObject.content.buckets.forEach((b: any) => {
        const items = b.items.reduce(
            (acc: any, i: any) => {
                if (isAttribute(i) && matchesDrillDownTargetAttribute(drillConfig, i)) {
                    return {
                        removed: [...acc.result],
                        result: [
                            {
                                ...i,
                                visualizationAttribute: {
                                    ...i.visualizationAttribute,
                                    displayForm:
                                        drillConfig.implicitDrillDown.target.drillToAttribute
                                            .attributeDisplayForm,
                                    alias: undefined,
                                },
                            },
                        ],
                    };
                }

                return { removed: acc.removed, result: [...acc.result, i] };
            },
            { removed: [], result: [] },
        );

        modifiedBuckets.push({ ...b, items: [...items.result] });
        removedItems.push(...items.removed);
    });

    const resultVisualization = {
        ...sourceVisualization,
        visualizationObject: {
            ...sourceVisualization.visualizationObject,
            content: {
                ...sourceVisualization.visualizationObject.content,
                buckets: modifiedBuckets,
            },
        },
    };

    return {
        visualization: resultVisualization,
        removed: removedItems || [],
    };
}

function removeTotalsForRemovedAttributes(visualization: IVisualization, removed: IRemovedAttribute[]) {
    const result = visualization.visualizationObject.content.buckets.map((b: any) => {
        if (b.localIdentifier === ENUM_BUCKETS_TYPE.ATTRIBUTE && b.totals) {
            const totals = b.totals.filter(
                (t: any) =>
                    !removed.find(
                        (r) =>
                            t.type === ENUM_BUCKETS_TYPE.ROLLUP_TOTAL &&
                            r.visualizationAttribute.localIdentifier === t.attributeIdentifier,
                    ),
            );

            return { ...b, totals };
        }

        return { ...b };
    });

    return {
        ...visualization,
        visualizationObject: {
            ...visualization.visualizationObject,
            content: {
                ...visualization.visualizationObject.content,
                buckets: result,
            },
        },
    };
}

function removePropertiesForRemovedAttributes(visualization: IVisualization, removed: IRemovedAttribute[]) {
    if (!visualization.visualizationObject.content.properties) {
        return visualization;
    }

    const properties: IVisualizationProperties = JSON.parse(
        visualization.visualizationObject.content.properties,
    );

    const result = Object.entries(properties).reduce((acc, [key, value]) => {
        if (key === ENUM_PROPERTIES_TYPE.CONTROLS && value.columnWidths) {
            const columns = value.columnWidths.filter((c: TColumnWidths) =>
                c.attributeColumnWidthItem
                    ? !removed.some(
                          (r) =>
                              c.attributeColumnWidthItem.attributeIdentifier ===
                              r.visualizationAttribute.localIdentifier,
                      )
                    : c,
            );

            return {
                ...acc,
                [key]: {
                    columnWidths: columns,
                },
            };
        }

        return { ...acc };
    }, properties);

    return {
        ...visualization,
        visualizationObject: {
            ...visualization.visualizationObject,
            content: {
                ...visualization.visualizationObject.content,
                properties: JSON.stringify(result),
            },
        },
    };
}

export function sanitizeTableProperties(sourceVisualization: IVisualization, removed: any) {
    let updateVisualization = sourceVisualization;

    if (removed.length > 0) {
        updateVisualization = removeTotalsForRemovedAttributes(updateVisualization, removed);
        updateVisualization = removePropertiesForRemovedAttributes(updateVisualization, removed);
    }

    return updateVisualization;
}
