// (C) 2020 GoodData Corporation

import { IInsight } from "@gooddata/sdk-model";
import { IVisualizationProperties } from "../../..";
import { IImplicitDrillDown, removeAttributesFromBuckets } from "../convertUtil";

const properties: IVisualizationProperties = {
    controls: {
        columnWidths: [
            {
                attributeColumnWidthItem: {
                    attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                    width: { value: 131 },
                },
            },
            {
                attributeColumnWidthItem: {
                    attributeIdentifier: "cab454e65960422282bf565291d0323f",
                    width: { value: 125 },
                },
            },
            {
                attributeColumnWidthItem: {
                    attributeIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                    width: { value: 97 },
                },
            },
            {
                attributeColumnWidthItem: {
                    attributeIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                    width: { value: 255 },
                },
            },
            { measureColumnWidthItem: { width: { value: 270 } } },
        ],
    },
    sortItems: [
        {
            attributeSortItem: {
                attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                direction: "desc",
            },
        },
    ],
};

const sourceVisualization: IInsight = {
    insight: {
        title: "visualizationObject",
        identifier: "visualizationObject",
        uri: "/visualizationObject",
        visualizationUrl: "visualizationClass-url",
        filters: [],
        sorts: [],
        buckets: [
            {
                localIdentifier: "attribute",
                items: [
                    {
                        attribute: {
                            localIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                            displayForm: {
                                uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1091",
                            },
                        },
                    },
                    {
                        attribute: {
                            localIdentifier: "cab454e65960422282bf565291d0323f",
                            displayForm: {
                                uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1089",
                            },
                        },
                    },
                    {
                        attribute: {
                            localIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                            displayForm: {
                                uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1103",
                            },
                        },
                    },
                    {
                        attribute: {
                            localIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                            displayForm: {
                                uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1086",
                            },
                        },
                    },
                ],
            },
            {
                localIdentifier: "measure",
                items: [
                    {
                        measure: {
                            localIdentifier: "627758b4e135480c8b39d61146178e0b",
                            definition: {
                                measureDefinition: {
                                    item: {
                                        uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1268",
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        ],
        properties,
    },
};

const drillConfig: IImplicitDrillDown = {
    implicitDrillDown: {
        from: { drillFromAttribute: { localIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85" } },
        target: {
            drillToAttribute: {
                attributeDisplayForm: {
                    uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1057",
                },
            },
        },
    },
};

describe("DrillDownService", () => {
    describe("createDrillDownTargetVisualization", () => {
        it("should replace target attribute display form URI and reset alias", () => {
            const visualizationAttribute2 = "visualizationAttribute2";
            const sourceVisualization: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    visualizationUrl: "visualizationClass-url",
                    filters: [],
                    sorts: [],
                    properties: {},
                    buckets: [
                        {
                            localIdentifier: "measures",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "measureLocalIdentifier",
                                        definition: {
                                            measureDefinition: { item: { uri: "measureDefinitionUri" } },
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: visualizationAttribute2,
                                        displayForm: { uri: "visualizationAttribute2-displayFormUri" },
                                        alias: "visualizationAttribute2-alias",
                                    },
                                },
                            ],
                        },
                    ],
                },
            };
            const implicitDrillDownTargetUri = "implicitDrillDownTargetUri";
            const drillConfig: IImplicitDrillDown = {
                implicitDrillDown: {
                    from: { drillFromAttribute: { localIdentifier: visualizationAttribute2 } },
                    target: {
                        drillToAttribute: { attributeDisplayForm: { uri: implicitDrillDownTargetUri } },
                    },
                },
            };
            const result = removeAttributesFromBuckets(sourceVisualization, drillConfig);
            const expected: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    visualizationUrl: "visualizationClass-url",
                    filters: [],
                    sorts: [],
                    properties: {},
                    buckets: [
                        {
                            localIdentifier: "measures",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "measureLocalIdentifier",
                                        definition: {
                                            measureDefinition: { item: { uri: "measureDefinitionUri" } },
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: visualizationAttribute2,
                                        displayForm: { uri: implicitDrillDownTargetUri },
                                        alias: undefined,
                                    },
                                },
                            ],
                        },
                    ],
                },
            };
            expect(result.insight).toEqual(expected);
        });

        it("should delete intersection filter attributes and sanitize properties", () => {
            const result = removeAttributesFromBuckets(sourceVisualization, drillConfig);
            const expected: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    visualizationUrl: "visualizationClass-url",
                    filters: [],
                    sorts: [],
                    buckets: [
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1057",
                                        },
                                        alias: undefined,
                                    },
                                },
                            ],
                        },
                        {
                            localIdentifier: "measure",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "627758b4e135480c8b39d61146178e0b",
                                        definition: {
                                            measureDefinition: {
                                                item: {
                                                    uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1268",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                    properties: {
                        controls: {
                            columnWidths: [
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                        width: {
                                            value: 131,
                                        },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "cab454e65960422282bf565291d0323f",
                                        width: {
                                            value: 125,
                                        },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                                        width: {
                                            value: 97,
                                        },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                                        width: { value: 255 },
                                    },
                                },
                                { measureColumnWidthItem: { width: { value: 270 } } },
                            ],
                        },
                        sortItems: [
                            {
                                attributeSortItem: {
                                    attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                    direction: "desc",
                                },
                            },
                        ],
                    },
                },
            };
            const removedItems = [
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1091",
                        },
                        localIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                    },
                },
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1089",
                        },
                        localIdentifier: "cab454e65960422282bf565291d0323f",
                    },
                },
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1103",
                        },
                        localIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                    },
                },
            ];
            expect(result.insight).toEqual(expected);
            expect(result.removedItems).toEqual(removedItems);
        });

        it("should update totals according to the deleted intersection attribute filters", () => {
            const sourceVisualization: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    filters: [],
                    sorts: [],
                    visualizationUrl: "visualizationClass-url",
                    buckets: [
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1091",
                                        },
                                    },
                                },
                                {
                                    attribute: {
                                        localIdentifier: "cab454e65960422282bf565291d0323f",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1089",
                                        },
                                    },
                                },
                                {
                                    attribute: {
                                        localIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1103",
                                        },
                                    },
                                },
                                {
                                    attribute: {
                                        localIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1086",
                                        },
                                    },
                                },
                            ],
                            totals: [
                                {
                                    measureIdentifier: "627758b4e135480c8b39d61146178e0b",
                                    attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                    type: "nat",
                                },
                            ],
                        },
                        {
                            localIdentifier: "measure",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "627758b4e135480c8b39d61146178e0b",
                                        definition: {
                                            measureDefinition: {
                                                item: {
                                                    uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1268",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                    properties,
                },
            };

            const result = removeAttributesFromBuckets(sourceVisualization, drillConfig);
            const expected: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    filters: [],
                    sorts: [],
                    visualizationUrl: "visualizationClass-url",
                    buckets: [
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1057",
                                        },
                                        alias: undefined,
                                    },
                                },
                            ],
                            totals: [
                                {
                                    attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                    measureIdentifier: "627758b4e135480c8b39d61146178e0b",
                                    type: "nat",
                                },
                            ],
                        },
                        {
                            localIdentifier: "measure",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "627758b4e135480c8b39d61146178e0b",
                                        definition: {
                                            measureDefinition: {
                                                item: {
                                                    uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1268",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                    properties: {
                        controls: {
                            columnWidths: [
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                        width: {
                                            value: 131,
                                        },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "cab454e65960422282bf565291d0323f",
                                        width: {
                                            value: 125,
                                        },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                                        width: {
                                            value: 97,
                                        },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "d7e1d1a3e9d8484bb0c7a858261c0f85",
                                        width: { value: 255 },
                                    },
                                },
                                { measureColumnWidthItem: { width: { value: 270 } } },
                            ],
                        },
                        sortItems: [
                            {
                                attributeSortItem: {
                                    attributeIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                                    direction: "desc",
                                },
                            },
                        ],
                    },
                },
            };
            const removedItems = [
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1091",
                        },
                        localIdentifier: "c3e615724abf4f2399d3191a6276c91a",
                    },
                },
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1089",
                        },
                        localIdentifier: "cab454e65960422282bf565291d0323f",
                    },
                },
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1103",
                        },
                        localIdentifier: "d3aa6c103c704f51a0f1c7f1dddc94f4",
                    },
                },
            ];
            expect(result.insight).toEqual(expected);
            expect(result.removedItems).toEqual(removedItems);
        });
        it("should respect sort and column width", () => {
            const drillConfig: IImplicitDrillDown = {
                implicitDrillDown: {
                    from: {
                        drillFromAttribute: {
                            localIdentifier: "7ad4d823ab424333a7d05aea78c47ada",
                        },
                    },
                    target: {
                        drillToAttribute: {
                            attributeDisplayForm: {
                                uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1057",
                            },
                        },
                    },
                },
            };
            const sourceVisualization: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    filters: [],
                    sorts: [],
                    visualizationUrl: "visualizationClass-url",
                    buckets: [
                        {
                            localIdentifier: "measure",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                        definition: {
                                            measureDefinition: {
                                                computeRatio: false,
                                                item: {
                                                    uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1267",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: "fcc12cf3e42546b1bec56778fd753a0a",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1094",
                                        },
                                    },
                                },
                                {
                                    attribute: {
                                        localIdentifier: "7ad4d823ab424333a7d05aea78c47ada",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1086",
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                    properties: {
                        controls: {
                            columnWidths: [
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "7ad4d823ab424333a7d05aea78c47ada",
                                        width: { value: 426 },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "fcc12cf3e42546b1bec56778fd753a0a",
                                        width: { value: 109 },
                                    },
                                },
                                {
                                    measureColumnWidthItem: {
                                        locators: [
                                            {
                                                attributeLocatorItem: {
                                                    attributeIdentifier: "0695047a663542b5a6d64c111302735b",
                                                    element: "2f0dd9bf0e224e0b93de84c89df65719",
                                                },
                                            },
                                            {
                                                measureLocatorItem: {
                                                    measureIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                                },
                                            },
                                        ],
                                        width: { value: 393 },
                                    },
                                },
                                {
                                    measureColumnWidthItem: {
                                        locators: [
                                            {
                                                attributeLocatorItem: {
                                                    attributeIdentifier: "0695047a663542b5a6d64c111302735b",
                                                    element: "2b3fda5d368c42218a85db41bc08b08a",
                                                },
                                            },
                                            {
                                                measureLocatorItem: {
                                                    measureIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                                },
                                            },
                                        ],
                                        width: { value: 231 },
                                    },
                                },
                            ],
                        },
                        sortItems: [
                            {
                                measureSortItem: {
                                    direction: "desc",
                                    locators: [
                                        {
                                            attributeLocatorItem: {
                                                attributeIdentifier: "0695047a663542b5a6d64c111302735b",
                                                element: "2b3fda5d368c42218a85db41bc08b08a",
                                            },
                                        },
                                        {
                                            measureLocatorItem: {
                                                measureIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            };
            const result = removeAttributesFromBuckets(sourceVisualization, drillConfig);
            const expected: IInsight = {
                insight: {
                    title: "visualizationObject",
                    identifier: "visualizationObject",
                    uri: "/visualizationObject",
                    filters: [],
                    sorts: [],
                    visualizationUrl: "visualizationClass-url",
                    buckets: [
                        {
                            localIdentifier: "measure",
                            items: [
                                {
                                    measure: {
                                        localIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",

                                        definition: {
                                            measureDefinition: {
                                                computeRatio: false,
                                                item: {
                                                    uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1267",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            localIdentifier: "attribute",
                            items: [
                                {
                                    attribute: {
                                        localIdentifier: "7ad4d823ab424333a7d05aea78c47ada",
                                        displayForm: {
                                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1057",
                                        },
                                        alias: undefined,
                                    },
                                },
                            ],
                        },
                    ],
                    properties: {
                        controls: {
                            columnWidths: [
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "7ad4d823ab424333a7d05aea78c47ada",
                                        width: { value: 426 },
                                    },
                                },
                                {
                                    attributeColumnWidthItem: {
                                        attributeIdentifier: "fcc12cf3e42546b1bec56778fd753a0a",
                                        width: {
                                            value: 109,
                                        },
                                    },
                                },
                                {
                                    measureColumnWidthItem: {
                                        locators: [
                                            {
                                                attributeLocatorItem: {
                                                    attributeIdentifier: "0695047a663542b5a6d64c111302735b",
                                                    element: "2f0dd9bf0e224e0b93de84c89df65719",
                                                },
                                            },
                                            {
                                                measureLocatorItem: {
                                                    measureIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                                },
                                            },
                                        ],
                                        width: { value: 393 },
                                    },
                                },
                                {
                                    measureColumnWidthItem: {
                                        locators: [
                                            {
                                                attributeLocatorItem: {
                                                    attributeIdentifier: "0695047a663542b5a6d64c111302735b",
                                                    element: "2b3fda5d368c42218a85db41bc08b08a",
                                                },
                                            },
                                            {
                                                measureLocatorItem: {
                                                    measureIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                                },
                                            },
                                        ],
                                        width: { value: 231 },
                                    },
                                },
                            ],
                        },
                        sortItems: [
                            {
                                measureSortItem: {
                                    direction: "desc",
                                    locators: [
                                        {
                                            attributeLocatorItem: {
                                                attributeIdentifier: "0695047a663542b5a6d64c111302735b",
                                                element: "2b3fda5d368c42218a85db41bc08b08a",
                                            },
                                        },
                                        {
                                            measureLocatorItem: {
                                                measureIdentifier: "c40fd1c7f3de4cba8cf0663bd57767f4",
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            };

            const removedItems = [
                {
                    attribute: {
                        displayForm: {
                            uri: "/gdc/md/heo9nbbna28ol3jnai0ut79tjer5cqdn/obj/1094",
                        },
                        localIdentifier: "fcc12cf3e42546b1bec56778fd753a0a",
                    },
                },
            ];

            expect(result.insight).toEqual(expected);
            expect(result.removedItems).toEqual(removedItems);
        });
    });
});
