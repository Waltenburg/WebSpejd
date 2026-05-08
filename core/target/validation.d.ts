import * as zod from "zod";
export declare const AnyNumber: zod.ZodUnion<[zod.ZodNumber, zod.ZodPipe<zod.ZodString, zod.ZodTransform<number, string>>]>;
/** Validation of a location id. */
export declare const LocationId: zod.ZodObject<{
    locationId: zod.ZodUnion<[zod.ZodNumber, zod.ZodPipe<zod.ZodString, zod.ZodTransform<number, string>>]>;
}, zod.z.core.$strip>;
export declare function parseParams<T extends zod.ZodObject>(parser: T, params: URLSearchParams): zod.infer<T>;
/**
 *
 */
export declare function parseUrlParams<T extends zod.ZodObject>(parser: T, url: URL): zod.infer<T>;
//# sourceMappingURL=validation.d.ts.map