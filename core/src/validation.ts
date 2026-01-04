import * as zod from "zod";

/**
 * Validation for a boolean.
 *
 * Works with both boolean types and integer types.
 */
export const boolean = zod.boolean()
    .or(zod.number().pipe(zod.transform(input => input >= 1)));
