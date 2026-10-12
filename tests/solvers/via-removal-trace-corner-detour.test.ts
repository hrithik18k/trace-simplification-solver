import { expect, test } from "bun:test"
import { UselessViaRemovalSolver } from "../../index"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("corner detours remove vias inside a narrow diagonal board outline", (): void => {
  const route: HighDensityRoute = {
    connectionName: "route",
    traceThickness: 0.1,
    viaDiameter: 0.3,
    route: [
      { x: 0, y: 0, z: 0 },
      { x: 0.5, y: 0.5, z: 0 },
      { x: 0.5, y: 0.5, z: 1 },
      { x: 3.5, y: 3.5, z: 1 },
      { x: 3.5, y: 3.5, z: 0 },
      { x: 4, y: 4, z: 0 },
    ],
    vias: [
      { x: 0.5, y: 0.5 },
      { x: 3.5, y: 3.5 },
    ],
  }
  const blocker: HighDensityRoute = {
    connectionName: "blocker",
    traceThickness: 0.1,
    viaDiameter: 0.3,
    route: [
      { x: 1.9, y: 2.1, z: 0 },
      { x: 2.1, y: 1.9, z: 0 },
    ],
    vias: [],
  }
  const original = structuredClone({ route, blocker })
  for (const enableRoutedTraceDetours of [false, true]) {
    const solver = new UselessViaRemovalSolver({
      unsimplifiedHdRoutes: [route],
      otherHdRoutes: [blocker],
      obstacles: [],
      colorMap: {},
      layerCount: 2,
      connMap: new ConnectivityMap({ route: ["route"], blocker: ["blocker"] }),
      outline: [
        { x: -0.5, y: -0.5 },
        { x: 0.7, y: -0.5 },
        { x: 4.5, y: 3.3 },
        { x: 4.5, y: 4.5 },
        { x: 3.3, y: 4.5 },
        { x: -0.5, y: 0.7 },
      ],
      enableGeometryShortcuts: true,
      enableObstacleDetourShortcuts: true,
      enableRoutedTraceDetours,
      preserveRouteEndpoints: true,
    })
    solver.solve()

    expect(solver.solved).toBe(true)
    const output = solver.getOptimizedHdRoutes()![0]
    expect(output.vias).toHaveLength(enableRoutedTraceDetours ? 0 : 2)
    expect(output.route[0]).toEqual(route.route[0])
    expect(output.route.at(-1)).toEqual(route.route.at(-1))
    if (enableRoutedTraceDetours) {
      expect(output.route.every((point) => point.z === 0)).toBe(true)
      expect(
        output.route.every((point) => Math.abs(point.y - point.x) <= 1.2),
      ).toBe(true)
    }
  }
  expect({ route, blocker }).toEqual(original)
})
