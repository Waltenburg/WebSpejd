import * as zod from "zod";
/**
 * Validation for a boolean.
 *
 * Works with both boolean types and integer types.
 */
export declare const boolean: zod.ZodUnion<[zod.ZodBoolean, zod.ZodPipe<zod.ZodNumber, zod.ZodTransform<boolean, number>>]>;
//# sourceMappingURL=validation.d.ts.map