import {Library} from "../server-api";

/**
 * This represents an item that is selectable on the left-hand navigation menu.
 */
export class MenuItem {
    /**
     * This name of the item. This is used to test which item is active.
     */
    name: string;
    /**
     * Optionally, if the item if a library.
     */
    library?: Library;

    constructor(name: string, library?: Library) {
        this.name = name;
        this.library = library;
    }
}