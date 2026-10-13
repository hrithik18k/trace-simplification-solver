import { expect, test } from "bun:test"
import { UselessViaRemovalSolver } from "../../index"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { HighDensityRoute } from "lib/types/high-density-types"

test("via removal detours around fixed routed copper without pad obstacles", (): void => {
  const route: HighDensityRoute = {
    connectionName: "route",
    traceThickness: 0.1,
    viaDiameter: 0.3,
    route: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: 1, y: 2, z: 1 },
      { x: 4, y: 2, z: 1 },
      { x: 4, y: 0, z: 1 },
      { x: 4, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
    ],
    vias: [
      { x: 1, y: 0 },
      { x: 4, y: 0 },
    ],
  }
  const fixedRoutes: HighDensityRoute[] = [
    {
      connectionName: "vertical",
      traceThickness: 0.1,
      viaDiameter: 0.3,
      route: [
        { x: 2.5, y: -0.5, z: 0 },
        { x: 2.5, y: 0.5, z: 0 },
      ],
      vias: [],
    },
    {
      connectionName: "horizontal",
      traceThickness: 0.1,
      viaDiameter: 0.3,
      route: [
        { x: 2, y: 2, z: 0 },
        { x: 3, y: 2, z: 0 },
      ],
      vias: [],
    },
  ]
  const original = structuredClone({ route, fixedRoutes })
  const solver = new UselessViaRemovalSolver({
    unsimplifiedHdRoutes: [route],
    otherHdRoutes: fixedRoutes,
    obstacles: [],
    colorMap: {},
    layerCount: 2,
    connMap: new ConnectivityMap({
      route: ["route"],
      vertical: ["vertical"],
      horizontal: ["horizontal"],
    }),
    enableGeometryShortcuts: true,
    enableRoutedTraceDetours: true,
    enableObstacleDetourShortcuts: true,
    preserveRouteEndpoints: true,
  })
  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  const output = solver.getOptimizedHdRoutes()![0]
  expect(output.vias).toHaveLength(0)
  expect(output.route.every((point) => point.z === 0)).toBe(true)
  expect(output.route[0]).toEqual(route.route[0])
  expect(output.route.at(-1)).toEqual(route.route.at(-1))
  expect({ route, fixedRoutes }).toEqual(original)
})
