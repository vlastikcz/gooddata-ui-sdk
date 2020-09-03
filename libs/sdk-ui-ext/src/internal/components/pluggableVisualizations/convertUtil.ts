// (C) 2020 GoodData Corporation
import {
    IAttribute,
    IAttributeOrMeasure,
    IBucket,
    IInsight,
    isAttribute,
    VisualizationProperties,
} from "@gooddata/sdk-model";

// TODO use proper type
type IImplicitDrillDown = any;

function matchesDrillDownTargetAttribute(drillConfig: IImplicitDrillDown, attribute: IAttribute) {
    const drillSourceLocalIdentifier = drillConfig.implicitDrillDown.from.drillFromAttribute.localIdentifier;
    return attribute.attribute.localIdentifier === drillSourceLocalIdentifier;
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

enum ENUM_PROPERTIES_TYPE {
    CONTROLS = "controls",
}

enum ENUM_BUCKETS_TYPE {
    ATTRIBUTE = "attribute",
    ROLLUP_TOTAL = "nat",
}

export function removeAttributesFromBuckets(
    insight: IInsight,
    drillConfig: IImplicitDrillDown,
): { insight: IInsight; removedItems: IAttribute[] } {
    const modifiedBuckets: IBucket[] = [];
    const removedItems: IAttribute[] = [];

    insight.insight.buckets.forEach((b: IBucket) => {
        const items: { removed: IAttribute[]; result: IAttributeOrMeasure[] } = b.items.reduce(
            (acc: { removed: IAttribute[]; result: IAttributeOrMeasure[] }, i: IAttributeOrMeasure) => {
                if (isAttribute(i) && matchesDrillDownTargetAttribute(drillConfig, i)) {
                    const displayForm =
                        drillConfig.implicitDrillDown.target.drillToAttribute.attributeDisplayForm;
                    return {
                        removed: [...acc.removed, i],
                        result: [
                            ...acc.result,
                            {
                                ...i,
                                attribute: {
                                    ...i.attribute,
                                    displayForm,
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

    const resultInsight = {
        ...insight,
        insight: {
            ...insight.insight,
            buckets: modifiedBuckets,
        },
    };

    return {
        insight: resultInsight,
        removedItems: removedItems || [],
    };
}

function removeTotalsForRemovedAttributes(insight: IInsight, removed: IAttribute[]) {
    const result = insight.insight.buckets.map((b: any) => {
        if (b.localIdentifier === ENUM_BUCKETS_TYPE.ATTRIBUTE && b.totals) {
            const totals = b.totals.filter(
                (t: any) =>
                    !removed.find(
                        (r) =>
                            t.type === ENUM_BUCKETS_TYPE.ROLLUP_TOTAL &&
                            r.attribute.localIdentifier === t.attributeIdentifier,
                    ),
            );

            return { ...b, totals };
        }

        return { ...b };
    });

    return {
        ...insight,
        insight: {
            ...insight.insight,
            buckets: result,
        },
    };
}

function removePropertiesForRemovedAttributes(insight: IInsight, removed: IAttribute[]) {
    if (!insight.insight.properties) {
        return insight;
    }

    const properties: VisualizationProperties = insight.insight.properties;

    const result = Object.entries(properties).reduce((acc, [key, value]) => {
        if (key === ENUM_PROPERTIES_TYPE.CONTROLS && value.columnWidths) {
            const columns = value.columnWidths.filter((c: TColumnWidths) =>
                c.attributeColumnWidthItem
                    ? !removed.some(
                          (r) =>
                              c.attributeColumnWidthItem.attributeIdentifier === r.attribute.localIdentifier,
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
        ...insight,
        insight: {
            ...insight.insight,
            properties: result,
        },
    };
}

export function sanitizeTableProperties(insight: IInsight, removed: IAttribute[]): IInsight {
    let updatedInsight = insight;

    if (removed.length > 0) {
        updatedInsight = removeTotalsForRemovedAttributes(updatedInsight, removed);
        updatedInsight = removePropertiesForRemovedAttributes(updatedInsight, removed);
    }

    return updatedInsight;
}
