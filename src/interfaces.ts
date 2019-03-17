import { Slot, SlotConfirmationStatus, slu } from "ask-sdk-model";

export interface IRequestAttributes {

    /**
     * The slot values for the current request.
     */
    slots: ISlotValues;

    /**
     * Searches for the translation of the given key, replaces the arguments
     * and returns the result.
     *
     * @param key
     * @param args
     */
    t(key: string, ...args: any[]): any;

    /**
     * Randomly picks a translation for the given key and returns it.
     *
     * Note: The value for the key must be an array.
     *
     * @param key
     */
    tr(key: string): string;

    [key: string]: any;
}

export interface ISessionAttributes {
    [key: string]: any;
}

export interface ISlots {
    [key: string]: Slot;
}

/**
 * A matched slot value (if `status.code` = "ER_SUCCESS_MATCH").
 */
export interface IMatchedSlotValue {
    /**
     * Name of the slot.
     */
    name: string;

    /**
     * Value that the user said (unresolved).
     */
    value: string;

    /**
     * `statis.code` = "ER_SUCCESS_MATCH"
     */
    isMatch: true;

    /**
     * The first resolved value.
     */
    resolved: string;

    /**
     * The first resolved id.
     */
    id: string;

    /**
     * `True` if there are multiple resolved values.
     */
    isAmbiguous: boolean;

    /**
     * All resolved values. If there are multiple values, `isAmbiguous` will be `true`.
     */
    values: slu.entityresolution.Value[];

    /**
     * Whether the user has explicitly confirmed or denied the value of this slot.
     */
    confirmationStatus: SlotConfirmationStatus;
}

/**
 * An unmatched slot value (if `status.code` != "ER_SUCCESS_MATCH").
 */
export interface IUnmatchedSlotValue {
    /**
     * Name of the slot.
     */
    name: string;

    /**
     * Value that the user said (unresolved).
     */
    value: string;

    /**
     * `statis.code` != "ER_SUCCESS_MATCH"
     */
    isMatch: false;

    /**
     * Whether the user has explicitly confirmed or denied the value of this slot.
     */
    confirmationStatus: SlotConfirmationStatus;
}

export interface ISlotValues {
    [key: string]: IMatchedSlotValue | IUnmatchedSlotValue | undefined;
}
