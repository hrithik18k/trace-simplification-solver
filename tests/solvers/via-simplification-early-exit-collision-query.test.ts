import { expect, test } from "bun:test"
import { HighDensityRouteSpatialIndex } from "../../lib/data-structures/HighDensityRouteSpatialIndex"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("early-exit clearance queries match complete queries across layers and index updates", (): void => {
  let seed = 1842
  const random = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const routes: HighDensityRoute[] = Array.from(
    { length: 24 },
    (_, index): HighDensityRoute => ({
      connectionName: `route_${index}`,
      rootConnectionName: `net_${index % 3}`,
      traceThickness: 0.1 + random(),
      viaDiameter: 0.3 + random() * 3,
      route: Array.from({ length: 4 }, () => ({
        x: random() * 12 - 6,
        y: random() * 12 - 6,
        z: Math.floor(random() * 2),
      })),
      vias: [{ x: random() * 12 - 6, y: random() * 12 - 6 }],
    }),
  )
  const index = new HighDensityRouteSpatialIndex(routes)
  const ignoreRoute = (route: HighDensityRoute): boolean =>
    route.rootConnectionName === "net_0"
  for (let round = 0; round < 2; round++) {
    for (let query = 0; query < 500; query++) {
      const start = {
        x: random() * 14 - 7,
        y: random() * 14 - 7,
        z: Math.floor(random() * 2),
      }
      const end = {
        x: random() * 14 - 7,
        y: random() * 14 - 7,
        z: start.z,
      }
      const margin = random() * 0.5
      const complete = index
        .getConflictingRoutesForSegment(start, end, margin)
        .filter(({ conflictingRoute }) => !ignoreRoute(conflictingRoute))
      const filtered = index.getConflictingRoutesForSegment(
        start,
        end,
        margin,
        ignoreRoute,
      )
      expect(filtered).toEqual(complete)
      expect(
        index.hasConflictingRoutesForSegment(start, end, margin, ignoreRoute),
      ).toBe(complete.length > 0)
    }
    index.removeRoute(routes[1].connectionName)
    index.addRoute({
      ...routes[1],
      viaDiameter: 5,
      route: [
        { x: -5, y: -5, z: 0 },
        { x: 5, y: 5, z: 0 },
      ],
      vias: [{ x: 1.01, y: 0.99 }],
    })
  }
})
