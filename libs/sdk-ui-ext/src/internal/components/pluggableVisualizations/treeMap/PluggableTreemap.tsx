// (C) 2019 GoodData Corporation
import React from "react";
import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import tail from "lodash/tail";
import { isDrillIntersectionAttributeItem, BucketNames, VisualizationTypes } from "@gooddata/sdk-ui";
import { render } from "react-dom";
import { BUCKETS } from "../../../constants/bucket";
import { TREEMAP_SUPPORTED_PROPERTIES } from "../../../constants/supportedProperties";

import {
    DEFAULT_TREEMAP_UICONFIG,
    TREEMAP_UICONFIG_WITH_MULTIPLE_MEASURES,
    TREEMAP_UICONFIG_WITH_ONE_MEASURE,
    UICONFIG,
} from "../../../constants/uiConfig";
import { IExtendedReferencePoint, IReferencePoint, IVisConstruct } from "../../../interfaces/Visualization";
import { configureOverTimeComparison, configurePercent } from "../../../utils/bucketConfig";

import {
    getAttributeItemsWithoutStacks,
    getMeasureItems,
    getStackItems,
    isDateBucketItem,
    limitNumberOfMeasuresInBuckets,
    removeAllArithmeticMeasuresFromDerived,
    removeAllDerivedMeasures,
    sanitizeFilters,
} from "../../../utils/bucketHelper";
import { getReferencePointWithSupportedProperties } from "../../../utils/propertiesHelper";
import { removeSort } from "../../../utils/sort";

import { setTreemapUiConfig } from "../../../utils/uiConfigHelpers/treemapUiConfigHelper";
import TreeMapConfigurationPanel from "../../configurationPanels/TreeMapConfigurationPanel";
import { PluggableBaseChart } from "../baseChart/PluggableBaseChart";
import { IInsight, IInsightDefinition } from "@gooddata/sdk-model";
import { SettingCatalog } from "@gooddata/sdk-backend-spi";
import { removeAttributesFromBuckets } from "../convertUtil";

export class PluggableTreemap extends PluggableBaseChart {
    constructor(props: IVisConstruct) {
        super(props);
        this.type = VisualizationTypes.TREEMAP;
        this.supportedPropertiesList = TREEMAP_SUPPORTED_PROPERTIES;
        this.initializeProperties(props.visualizationProperties);
    }

    public getExtendedReferencePoint(referencePoint: IReferencePoint): Promise<IExtendedReferencePoint> {
        const clonedReferencePoint = cloneDeep(referencePoint);
        let newReferencePoint: IExtendedReferencePoint = {
            ...clonedReferencePoint,
            uiConfig: cloneDeep(DEFAULT_TREEMAP_UICONFIG),
        };

        newReferencePoint = removeAllArithmeticMeasuresFromDerived(newReferencePoint);
        newReferencePoint = removeAllDerivedMeasures(newReferencePoint);

        const buckets = get(clonedReferencePoint, BUCKETS, []);

        let measures = getMeasureItems(buckets);

        let stacks = getStackItems(buckets);
        const nonStackAttributes = getAttributeItemsWithoutStacks(buckets);
        const view = nonStackAttributes.slice(0, 1);

        if (nonStackAttributes.length > 0) {
            set(newReferencePoint, UICONFIG, cloneDeep(TREEMAP_UICONFIG_WITH_ONE_MEASURE));
            measures = getMeasureItems(limitNumberOfMeasuresInBuckets(buckets, 1));
        } else if (measures.length > 1) {
            set(newReferencePoint, UICONFIG, cloneDeep(TREEMAP_UICONFIG_WITH_MULTIPLE_MEASURES));
        }
        if (nonStackAttributes.length > 1 && isEmpty(stacks)) {
            // first attribute is taken, find next available non-date attribute
            const attributesWithoutFirst = tail(nonStackAttributes);
            const nonDate = attributesWithoutFirst.filter((attribute) => !isDateBucketItem(attribute));
            stacks = nonDate.slice(0, 1);
        }

        set(newReferencePoint, BUCKETS, [
            {
                localIdentifier: BucketNames.MEASURES,
                items: measures,
            },
            {
                localIdentifier: BucketNames.VIEW,
                items: view,
            },
            {
                localIdentifier: BucketNames.SEGMENT,
                items: stacks,
            },
        ]);

        newReferencePoint = setTreemapUiConfig(newReferencePoint, this.intl, this.type);
        newReferencePoint = configurePercent(newReferencePoint, false);
        newReferencePoint = configureOverTimeComparison(
            newReferencePoint,
            !!this.featureFlags[SettingCatalog.enableWeekFilters],
        );
        newReferencePoint = getReferencePointWithSupportedProperties(
            newReferencePoint,
            this.supportedPropertiesList,
        );
        newReferencePoint = removeSort(newReferencePoint);

        return Promise.resolve(sanitizeFilters(newReferencePoint));
    }

    private addFiltersForTreemap(source: IInsight, drillConfig: any, _event: any) {
        const clicked = drillConfig.implicitDrillDown.from.drillFromAttribute.localIdentifier;

        // treemap just reverse the intersection
        const intersection = _event.drillContext.intersection.reverse();

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
        const withFilters = this.addFiltersForTreemap(source, drillConfig, event);
        return removeAttributesFromBuckets(withFilters, drillConfig).insight;
    }

    protected renderConfigurationPanel(insight: IInsightDefinition): void {
        if (document.querySelector(this.configPanelElement)) {
            render(
                <TreeMapConfigurationPanel
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
    }
}
