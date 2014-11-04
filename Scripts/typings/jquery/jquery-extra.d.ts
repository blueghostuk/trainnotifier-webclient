interface JQuery {
    /**
     * Used to set disabled attribute, it may be wrong but it actually works
     *
     * @param attributeName The name of the attribute to set.
     * @param value A value to set for the attribute.
     */
    attr(attributeName: string, value: boolean): JQuery;
} 