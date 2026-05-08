import * as zod from "zod";
export const AnyNumber = zod.number()
    .or(zod.string().pipe(zod.transform(input => Number.parseInt(input))));
/** Validation of a location id. */
export const LocationId = zod.object({
    locationId: AnyNumber
});
export function parseParams(parser, params) {
    return parser.parse(Object.fromEntries(params.entries()));
}
/**
 *
 */
export function parseUrlParams(parser, url) {
    return parseParams(parser, url.searchParams);
}
//# sourceMappingURL=validation.js.map