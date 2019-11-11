// (C) 2007-2018 GoodData Corporation
import * as React from "react";
import Dropdown, { DropdownButton } from "@gooddata/goodstrap/lib/Dropdown/Dropdown";
import { string as stringUtils } from "@gooddata/js-utils";
import { IValidElementsResponse } from "@gooddata/gd-bear-client";
import { IElement, IAnalyticalBackend, IElementQueryResult } from "@gooddata/sdk-backend-spi";
import * as classNames from "classnames";

import { AttributeDropdownBody } from "./AttributeDropdownBody";
import { VISIBLE_ITEMS_COUNT } from "./AttributeDropdownList";
import { mergeElementQueryResults, EmptyListItem } from "./mergeElementQueryResults";

export interface IValidElementsItem {
    uri: string;
    title: string;
}

export interface IAttributeMetadata {
    getValidElements: (
        projectId: string,
        objectId: string,
        options: object,
    ) => Promise<IValidElementsResponse>;
}

export interface IAttributeDropdownProps {
    title: string;

    backend: IAnalyticalBackend;
    workspace: string;
    identifier: string;

    onApply: (selectedItems: IElement[], isInverted: boolean) => void;
    fullscreenOnMobile?: boolean;
}

export interface IAttributeDropdownStateItem {
    title: string;
    uri: string;
    selected?: boolean;
}

export interface IAttributeDropdownState {
    validElements?: IElementQueryResult;
    selectedItems: IElement[];
    isInverted: boolean;
    isLoading: boolean;
    error?: any;

    // paging
    offset: number;
    limit: number;
    totalCount?: string;
}

export class AttributeDropdown extends React.PureComponent<IAttributeDropdownProps, IAttributeDropdownState> {
    public static defaultProps = {
        fullscreenOnMobile: false,
    };

    private dropdownRef = React.createRef<Dropdown>();

    private MediaQuery?: ({
        children,
    }: {
        children: (isMobile: boolean) => React.ReactNode;
    }) => React.ReactNode;

    private getBackend = () => {
        return this.props.backend.withTelemetry("AttributeFilter", this.props);
    };

    constructor(props: IAttributeDropdownProps) {
        super(props);

        this.state = {
            validElements: null,
            selectedItems: [],
            isLoading: false,
            limit: VISIBLE_ITEMS_COUNT,
            offset: 0,
            isInverted: true,
        };

        this.createMediaQuery(props.fullscreenOnMobile);
    }

    public componentDidUpdate(prevProps: IAttributeDropdownProps): void {
        const needsInvalidation =
            this.props.identifier !== prevProps.identifier || this.props.workspace !== prevProps.workspace;

        if (needsInvalidation) {
            this.setState({ validElements: null, error: null, isLoading: false, limit: VISIBLE_ITEMS_COUNT });
            this.getElements();
        }
    }

    public getElements = async () => {
        const { offset, limit, validElements } = this.state;

        const currentElements = validElements ? validElements.elements : [];

        const isQueryOutOfBounds = offset + limit > currentElements.length;
        const isMissingDataInWindow = currentElements
            .slice(offset, offset + limit)
            .some((e: IElement | EmptyListItem) => (e as EmptyListItem).empty);

        const hasAllData =
            validElements &&
            currentElements.length === validElements.totalCount &&
            !currentElements.some((e: IElement | EmptyListItem) => (e as EmptyListItem).empty);

        const needsLoading = !hasAllData && (isQueryOutOfBounds || isMissingDataInWindow);

        if (needsLoading) {
            this.loadElements(offset, limit);
        }
    };

    private loadElements = async (offset: number, limit: number) => {
        const { workspace, identifier } = this.props;

        this.setState({ isLoading: true });

        const newElements = await this.getBackend()
            .workspace(workspace)
            .elements()
            .forObject(identifier)
            .withOffset(offset)
            .withLimit(limit)
            .query();

        this.setState(state => {
            const mergedValidElements = mergeElementQueryResults(state.validElements, newElements);

            return {
                ...state,
                isLoading: false,
                validElements: mergedValidElements,
            };
        });
    };

    public render() {
        const { title } = this.props;
        const classes = classNames(
            "gd-attribute-filter",
            title ? `gd-id-${stringUtils.simplifyText(title)}` : "",
        );

        return (
            <Dropdown
                button={<DropdownButton value={title} />}
                ref={this.dropdownRef}
                body={this.renderDropdownBody()}
                className={classes}
                MediaQuery={this.MediaQuery}
                onOpenStateChanged={this.onDropdownOpenStateChanged}
            />
        );
    }

    private createMediaQuery(fullscreenOnMobile: boolean) {
        this.MediaQuery = fullscreenOnMobile
            ? undefined
            : ({ children }: { children: (isMobile: boolean) => React.ReactNode }) => children(false);
    }

    private onDropdownOpenStateChanged = (isOpen: boolean) => {
        if (isOpen) {
            this.getElements();
        }
    };

    private onApplyButtonClicked = () => {
        this.props.onApply(this.state.selectedItems, this.state.isInverted);
        if (this.dropdownRef.current) {
            this.dropdownRef.current.closeDropdown();
        }
    };

    private onCloseButtonClicked = () => {
        if (this.dropdownRef.current) {
            this.dropdownRef.current.closeDropdown();
        }
    };

    private onSelect = (selectedItems: IElement[], isInverted: boolean) => {
        this.setState({
            selectedItems,
            isInverted,
        });
    };

    private onRangeChange = (_searchString: string, from: number, to: number) => {
        this.setState({ offset: from, limit: to - from }, () => this.getElements());
    };

    private renderDropdownBody() {
        const { selectedItems, isInverted, error, isLoading, validElements } = this.state;

        const shouldDisableApplyButton =
            error || isLoading || (validElements && !validElements.elements.length);
        const hasTriedToLoadData = validElements && validElements.elements;

        return (
            <AttributeDropdownBody
                error={error}
                isLoading={!hasTriedToLoadData && isLoading}
                items={validElements ? validElements.elements : []}
                isInverted={isInverted}
                onRangeChange={this.onRangeChange}
                selectedItems={selectedItems}
                totalCount={validElements ? validElements.totalCount : VISIBLE_ITEMS_COUNT}
                applyDisabled={shouldDisableApplyButton}
                onSelect={this.onSelect}
                onApplyButtonClicked={this.onApplyButtonClicked}
                onCloseButtonClicked={this.onCloseButtonClicked}
            />
        );
    }
}