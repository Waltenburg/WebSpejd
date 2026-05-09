import * as zod from "zod";

export const AnyNumber = zod.number()
    .or(zod.string().pipe(zod.transform(input => Number.parseInt(input))));

/** Validation of a location id. */
export const LocationId = zod.object({
    locationId: AnyNumber
});

export function parseParams<T extends zod.ZodObject>(parser: T, params: URLSearchParams): zod.infer<T> {
    return parser.parse(Object.fromEntries(params.entries()))
}

/**
 *
 */
export function parseUrlParams<T extends zod.ZodObject>(parser: T, url: URL): zod.infer<T> {
    return parseParams(parser, url.searchParams);
}
