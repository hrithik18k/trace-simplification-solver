import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { HighDensityRoute } from "lib/types/high-density-types"
import { HighDensityRouteSpatialIndex } from "../../lib/data-structures/HighDensityRouteSpatialIndex"
import { ObstacleSpatialHashIndex } from "../../lib/data-structures/ObstacleTree"
import { createObstacleDetourPathValidator } from "../../lib/solvers/UselessViaRemovalSolver/create-obstacle-detour-path-validator"

test("cached clearance preserves exact via-boundary comparisons", (): void => {
  const route: HighDensityRoute = {
    connectionName: "route",
    traceThickness: 0.1,
    viaDiameter: 0.6,
    route: [
      { x: -1, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ],
    vias: [],
  }
  const clearance = route.traceThickness / 2 + 0.6 / 2 + 0.1
  for (const offset of [-1e-9, 0, 1e-9]) {
    const blocker: HighDensityRoute = {
      connectionName: "blocker",
      traceThickness: 0.1,
      viaDiameter: 0.6,
      route: [],
      vias: [{ x: 0, y: clearance + offset }],
    }
    const validate = createObstacleDetourPathValidator({
      targetZ: 0,
      route,
      hdRouteSHI: new HighDensityRouteSpatialIndex([blocker]),
      obstacleSHI: new ObstacleSpatialHashIndex("flatbush", []),
      connMap: new ConnectivityMap({ route: ["route"], blocker: ["blocker"] }),
      defaultTraceThickness: 0.1,
      obstacleMargin: 0.15,
      traceMargin: 0.1,
      useNumericSegmentKeys: true,
    })
    expect(validate(route.route, 0)).toBe(offset >= 0)
    expect(validate(route.route, 0)).toBe(offset >= 0)
  }
})
