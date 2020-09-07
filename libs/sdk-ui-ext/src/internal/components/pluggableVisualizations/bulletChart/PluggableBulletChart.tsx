// (C) 2019-2020 GoodData Corporation
import React from "react";
import { render } from "react-dom";
import { configurePercent, configureOverTimeComparison } from "../../../utils/bucketConfig";
import cloneDeep from "lodash/cloneDeep";
import { PluggableBaseChart } from "../baseChart/PluggableBaseChart";
import {
    IReferencePoint,
    IExtendedReferencePoint,
    IVisConstruct,
    IBucketItem,
    IBucketOfFun,
} from "../../../interfaces/Visualization";

import {
    sanitizeFilters,
    findDerivedBucketItem,
    isDerivedBucketItem,
    hasDerivedBucketItems,
} from "../../../utils/bucketHelper";

import { BUCKETS } from "../../../constants/bucket";
import { removeSort } from "../../../utils/sort";
import { getBulletChartUiConfig } from "../../../utils/uiConfigHelpers/bulletChartUiConfigHelper";
import { DEFAULT_BULLET_CHART_CONFIG } from "../../../constants/uiConfig";
import { BULLET_CHART_SUPPORTED_PROPERTIES } from "../../../constants/supportedProperties";
import BulletChartConfigurationPanel from "../../configurationPanels/BulletChartConfigurationPanel";
import { getReferencePointWithSupportedProperties } from "../../../utils/propertiesHelper";
import { isDrillIntersectionAttributeItem, VisualizationTypes } from "@gooddata/sdk-ui";
import { IInsight, IInsightDefinition } from "@gooddata/sdk-model";
import { transformBuckets } from "./bucketHelper";
import { SettingCatalog } from "@gooddata/sdk-backend-spi";
import { removeAttributesFromBuckets } from "../convertUtil";

export class PluggableBulletChart extends PluggableBaseChart {
    constructor(props: IVisConstruct) {
        super(props);

        this.type = VisualizationTypes.BULLET;
        this.supportedPropertiesList = BULLET_CHART_SUPPORTED_PROPERTIES;

        this.initializeProperties(props.visualizationProperties);
    }

    public getExtendedReferencePoint(referencePoint: IReferencePoint): Promise<IExtendedReferencePoint> {
        const clonedReferencePoint = cloneDeep(referencePoint);

        let newReferencePoint: IExtendedReferencePoint = {
            ...clonedReferencePoint,
            uiConfig: cloneDeep(DEFAULT_BULLET_CHART_CONFIG),
        };

        const buckets = transformBuckets(newReferencePoint.buckets);

        newReferencePoint[BUCKETS] = buckets;

        newReferencePoint = getBulletChartUiConfig(newReferencePoint, this.intl, this.type);
        newReferencePoint = configurePercent(newReferencePoint, true);
        newReferencePoint = configureOverTimeComparison(
            newReferencePoint,
            !!this.featureFlags[SettingCatalog.enableWeekFilters],
        );
        newReferencePoint = getReferencePointWithSupportedProperties(
            newReferencePoint,
            this.supportedPropertiesList,
        );
        newReferencePoint = removeSort(newReferencePoint);

        this.setPrimaryMeasureIsMissingError(buckets);

        return Promise.resolve(sanitizeFilters(newReferencePoint));
    }

    private addFiltersForBullet(source: IInsight, drillConfig: any, _event: any) {
        const clicked = drillConfig.implicitDrillDown.from.drillFromAttribute.localIdentifier;

        let intersection = _event.drillContext.intersection;
        const index = intersection.findIndex(
            (item: any) =>
                item.header.attributeHeader && item.header.attributeHeader.localIdentifier === clicked,
        );
        const cutIntersection = intersection.slice(index);

        const filters = cutIntersection
            .map((i: any) => i.header)
            .filter(isDrillIntersectionAttributeItem)
            .map((h: any) => ({
                positiveAttributeFilter: {
                    displayForm: {
                        uri: h.attributeHeader.uri,
                    },
                    in: [h.attributeHeaderItem.uri],
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
        const withFilters = this.addFiltersForBullet(source, drillConfig, event);
        return removeAttributesFromBuckets(withFilters, drillConfig).insight;
    }

    protected renderConfigurationPanel(insight: IInsightDefinition): React.ReactNode {
        if (document.querySelector(this.configPanelElement)) {
            render(
                <BulletChartConfigurationPanel
                    locale={this.locale}
                    references={this.references}
                    properties={this.visualizationProperties}
                    propertiesMeta={this.propertiesMeta}
                    insight={insight}
                    colors={this.colors}
                    pushData={this.handlePushData}
                    type={this.type}
                    isError={this.getIsError()}
                    isLoading={this.isLoading}
                    featureFlags={this.featureFlags}
                />,
                document.querySelector(this.configPanelElement),
            );
        }

        return null;
    }

    protected mergeDerivedBucketItems(
        referencePoint: IReferencePoint,
        bucket: IBucketOfFun,
        newDerivedBucketItems: IBucketItem[],
    ): IBucketItem[] {
        return bucket.items.reduce((resultItems: IBucketItem[], bucketItem: IBucketItem) => {
            resultItems.push(bucketItem);

            const newDerivedBucketItem = findDerivedBucketItem(bucketItem, newDerivedBucketItems);
            const shouldAddItem =
                newDerivedBucketItem &&
                !isDerivedBucketItem(bucketItem) &&
                !hasDerivedBucketItems(bucketItem, referencePoint.buckets);

            if (shouldAddItem) {
                resultItems.push(newDerivedBucketItem);
            }

            return resultItems;
        }, []);
    }

    private setPrimaryMeasureIsMissingError(measureBuckets: IBucketOfFun[]): void {
        const hasPrimaryMeasureIsMissingError =
            measureBuckets[0].items.length === 0 &&
            (measureBuckets[1].items.length > 0 || measureBuckets[2].items.length > 0);

        this.setIsError(hasPrimaryMeasureIsMissingError);
    }
}
