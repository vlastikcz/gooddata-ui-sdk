// (C) 2020 GoodData Corporation
import { InvariantError } from "ts-invariant";

import { IInsightDefinition, insightBuckets, insightSetBuckets, insightSorts } from ".";
import { bucketAttributeIndex, bucketSetTotals, bucketTotals, IBucket } from "../execution/buckets";
import { isAttributeSort, isMeasureSort, ISortItem, sortEntityIds } from "../execution/base/sort";
import { ITotal } from "../execution/base/totals";
import { isAttribute } from "../execution/attribute";

/**
 * Makes sure the insight does not have any nonsensical data (like totals that no longer make sense, etc.), before it is saved.
 *
 * @param insight - the insight or insight definition to sanitize
 * @public
 */
export function insightSanitize<T extends IInsightDefinition>(insight: T): T {
    return removeInvalidTotals(insight);
}

function removeInvalidTotals<T extends IInsightDefinition>(insight: T): T {
    const sortItems = insightSorts(insight);

    const sanitizedBuckets = insightBuckets(insight).map((bucket) => {
        const totals = bucketTotals(bucket);

        if (totals.length && isSortedOnDifferentThanFirstAttributeInBucket(bucket, sortItems)) {
            bucket.totals = getBucketTotalsWithoutSubtotals(bucket);
            if (totals.length === 0) {
                return bucketSetTotals(bucket, []);
            }
        }

        const sanitizedTotals = totals.length ? filterInvalidTotalAttributesInBucket(totals, bucket) : totals;
        if (sanitizedTotals.length !== totals.length) {
            return bucketSetTotals(bucket, sanitizedTotals);
        }

        return bucket;
    });

    return insightSetBuckets(insight, sanitizedBuckets);
}

function isSortedOnDifferentThanFirstAttributeInBucket(bucket: IBucket, sortItems: ISortItem[]): boolean {
    return sortItems.some((sortItem) => {
        if (isAttributeSort(sortItem)) {
            const attributeIdentifier = sortEntityIds(sortItem).attributeIdentifiers[0];
            const attributeIndex = bucketAttributeIndex(bucket, attributeIdentifier);
            return attributeIndex > 0;
        } else if (isMeasureSort(sortItem)) {
            return true;
        }
        throw new InvariantError(
            'Unexpected sortType, only supported sortTypes are "attributeSortItem" and "measureSortItem"',
        );
    });
}

function filterInvalidTotalAttributesInBucket(totals: ITotal[], bucket: IBucket): ITotal[] {
    const attributes = bucket.items
        .filter(isAttribute)
        .map((attribute) => attribute.attribute.localIdentifier);
    return totals.filter((total) => {
        const x = attributes.includes(total.attributeIdentifier);
        return x;
    });
}

function getBucketTotalsWithoutSubtotals(bucket: IBucket): ITotal[] {
    return bucketTotals(bucket).filter(
        (total) => bucketAttributeIndex(bucket, total.attributeIdentifier) === 0,
    );
}
