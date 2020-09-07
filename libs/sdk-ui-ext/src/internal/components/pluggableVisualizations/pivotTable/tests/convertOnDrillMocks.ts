// (C) 2020 GoodData Corporation

import { IInsight } from "@gooddata/sdk-model";
import { IImplicitDrillDown } from "../../convertUtil";
import { IVisualizationProperties } from "../../../..";

export const properties: IVisualizationProperties = {
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

export const sourceInsight: IInsight = {
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

export const drillConfig: IImplicitDrillDown = {
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
