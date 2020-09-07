// (C) 2019 GoodData Corporation
import get from "lodash/get";
import set from "lodash/set";
import last from "lodash/last";
import { IInsight, bucketsItems, IInsightDefinition, insightBuckets } from "@gooddata/sdk-model";
import { isDrillIntersectionAttributeItem, BucketNames } from "@gooddata/sdk-ui";
import { AXIS } from "../../constants/axis";
import { BUCKETS } from "../../constants/bucket";
import { MAX_CATEGORIES_COUNT, MAX_STACKS_COUNT, UICONFIG, UICONFIG_AXIS } from "../../constants/uiConfig";
import {
    IBucketOfFun,
    IExtendedReferencePoint,
    IReferencePoint,
    IVisConstruct,
} from "../../interfaces/Visualization";
import {
    getAllCategoriesAttributeItems,
    getDateItems,
    getFilteredMeasuresForStackedCharts,
    getStackItems,
    isDateBucketItem,
    isNotDateBucketItem,
} from "../../utils/bucketHelper";
import {
    getReferencePointWithSupportedProperties,
    isStackingMeasure,
    isStackingToPercent,
    removeImmutableOptionalStackingProperties,
    setSecondaryMeasures,
} from "../../utils/propertiesHelper";
import { setColumnBarChartUiConfig } from "../../utils/uiConfigHelpers/columnBarChartUiConfigHelper";
import { PluggableBaseChart } from "./baseChart/PluggableBaseChart";
import { removeAttributesFromBuckets } from "./convertUtil";

export class PluggableColumnBarCharts extends PluggableBaseChart {
    constructor(props: IVisConstruct) {
        super(props);
        // set default to DUAL to get the full supported props list
        // and will be updated in getExtendedReferencePoint
        this.axis = AXIS.DUAL;
        this.supportedPropertiesList = this.getSupportedPropertiesList();
    }

    public getExtendedReferencePoint(referencePoint: IReferencePoint): Promise<IExtendedReferencePoint> {
        // reset the list to retrieve full 'referencePoint.properties.controls'
        this.supportedPropertiesList = this.getSupportedPropertiesList();
        return super.getExtendedReferencePoint(referencePoint).then((ext: IExtendedReferencePoint) => {
            let newExt = setSecondaryMeasures(ext, this.secondaryAxis);

            this.axis = get(newExt, UICONFIG_AXIS, AXIS.PRIMARY);

            // filter out unnecessary stacking props for some specific cases such as one measure or empty stackBy
            this.supportedPropertiesList = removeImmutableOptionalStackingProperties(
                newExt,
                this.getSupportedPropertiesList(),
            );

            newExt = getReferencePointWithSupportedProperties(newExt, this.supportedPropertiesList);
            return setColumnBarChartUiConfig(newExt, this.intl);
        });
    }

    public isOpenAsReportSupported(): boolean {
        return (
            super.isOpenAsReportSupported() &&
            !haveManyViewItems(this.currentInsight) &&
            !isStackingMeasure(this.visualizationProperties) &&
            !isStackingToPercent(this.visualizationProperties)
        );
    }

    private addFiltersForColumnBar(source: IInsight, drillConfig: any, _event: any) {
        const clicked = drillConfig.implicitDrillDown.from.drillFromAttribute.localIdentifier;
        const buckets = source.insight.buckets;

        // column chart
        const stack = get(
            buckets.find((bucket) => bucket.localIdentifier === BucketNames.STACK),
            "items",
            [],
        );

        let reorderedIntersection = _event.drillContext.intersection;
        if (stack.length > 0) {
            const lastItem = last(reorderedIntersection);
            const beginning = reorderedIntersection.slice(0, -1);

            // don't care about measures, they'll be filtered out
            reorderedIntersection = [lastItem, ...beginning];
        }

        const index = reorderedIntersection.findIndex(
            (item: any) =>
                item.header.attributeHeader && item.header.attributeHeader.localIdentifier === clicked,
        );
        const cutIntersection = reorderedIntersection.slice(index);

        const filters = cutIntersection
            .map((i: any) => i.header)
            .filter(isDrillIntersectionAttributeItem)
            .map((h: any) => ({
                positiveAttributeFilter: {
                    displayForm: {
                        uri: h.attributeHeader.uri,
                    },
                    in: {
                        uris: [h.attributeHeaderItem.uri],
                    },
                },
            }));

        return {
            insight: {
                ...source.insight,
                filters: [...source.insight.filters, ...filters],
            },
        };
    }

    public convertOnDrill(source: IInsight, drillConfig: any, event: any): IInsight {
        const withFilters = this.addFiltersForColumnBar(source, drillConfig, event);
        return removeAttributesFromBuckets(withFilters, drillConfig).insight;
    }

    protected configureBuckets(extendedReferencePoint: IExtendedReferencePoint): void {
        const buckets: IBucketOfFun[] = get(extendedReferencePoint, BUCKETS, []);
        const measures = getFilteredMeasuresForStackedCharts(buckets);
        const dateItems = getDateItems(buckets);
        const categoriesCount: number = get(
            extendedReferencePoint,
            [UICONFIG, BUCKETS, BucketNames.VIEW, "itemsLimit"],
            MAX_CATEGORIES_COUNT,
        );
        const allAttributesWithoutStacks = getAllCategoriesAttributeItems(buckets);
        let views = allAttributesWithoutStacks.slice(0, categoriesCount);
        const hasDateItemInViewByBucket = views.some(isDateBucketItem);
        let stackItemIndex = categoriesCount;
        let stacks = getStackItems(buckets);

        if (dateItems.length && !hasDateItemInViewByBucket) {
            const extraViewItems = allAttributesWithoutStacks.slice(0, categoriesCount - 1);
            views = [dateItems[0], ...extraViewItems];
            stackItemIndex = categoriesCount - 1;
        }

        if (!stacks.length && measures.length <= 1 && allAttributesWithoutStacks.length > stackItemIndex) {
            stacks = allAttributesWithoutStacks
                .slice(stackItemIndex, allAttributesWithoutStacks.length)
                .filter(isNotDateBucketItem)
                .slice(0, MAX_STACKS_COUNT);
        }

        set(extendedReferencePoint, BUCKETS, [
            {
                localIdentifier: BucketNames.MEASURES,
                items: measures,
            },
            {
                localIdentifier: BucketNames.VIEW,
                items: views,
            },
            {
                localIdentifier: BucketNames.STACK,
                items: stacks,
            },
        ]);
    }
}

function haveManyViewItems(insight: IInsightDefinition): boolean {
    return bucketsItems(insightBuckets(insight, BucketNames.VIEW)).length > 1;
}
