/*
 * Exact geometry helpers for Synergetics 95.
 * Copyright (c) 2026 QSOL-IMC
 * SPDX-License-Identifier: MPL-2.0
 *
 * The Quadray normalization follows the earlier MIT-licensed
 * QSOLKCB/synergetics-viz implementation. See NOTICE.md.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SynergeticsMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TAU = Math.PI * 2;
  const SQRT2 = Math.sqrt(2);
  const SQRT3 = Math.sqrt(3);
  const PHI = (1 + Math.sqrt(5)) / 2;
  const EPSILON = 1e-9;
  const BASIS_COMPONENT = SQRT2 / 4;
  const SQRT6_OVER_4 = Math.sqrt(6) / 4;

  const V = Object.freeze({
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    scale: (a, value) => [a[0] * value, a[1] * value, a[2] * value],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ],
    length: (a) => Math.hypot(a[0], a[1], a[2]),
    distance: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
    unit: (a) => {
      const length = Math.hypot(a[0], a[1], a[2]);
      return length < EPSILON ? [0, 0, 0] : [a[0] / length, a[1] / length, a[2] / length];
    },
    lerp: (a, b, t) => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ],
    centroid: (points) => points.reduce((sum, point) => V.add(sum, point), [0, 0, 0]).map((value) => value / points.length)
  });

  const quadrayBasis = Object.freeze({
    A: [ BASIS_COMPONENT,  BASIS_COMPONENT,  BASIS_COMPONENT],
    B: [ BASIS_COMPONENT, -BASIS_COMPONENT, -BASIS_COMPONENT],
    C: [-BASIS_COMPONENT,  BASIS_COMPONENT, -BASIS_COMPONENT],
    D: [-BASIS_COMPONENT, -BASIS_COMPONENT,  BASIS_COMPONENT]
  });
  const basisNames = Object.freeze(Object.keys(quadrayBasis));

  function canonicalQuadray(tuple) {
    if (!Array.isArray(tuple) || tuple.length !== 4 || tuple.some((value) => !Number.isFinite(Number(value)))) {
      throw new TypeError('A Quadray tuple must contain four finite numbers.');
    }
    const numeric = tuple.map(Number);
    const minimum = Math.min(...numeric);
    return numeric.map((value) => value - minimum);
  }

  function quadrayToXYZ(tuple) {
    const canonical = canonicalQuadray(tuple);
    return canonical.reduce((sum, value, index) => V.add(sum, V.scale(quadrayBasis[basisNames[index]], value)), [0, 0, 0]);
  }

  function euclideanTetraVolume(points) {
    if (!Array.isArray(points) || points.length !== 4) throw new TypeError('A tetrahedron needs four vertices.');
    const [a, b, c, d] = points;
    return Math.abs(V.dot(V.sub(b, a), V.cross(V.sub(c, a), V.sub(d, a)))) / 6;
  }

  function tetravolume(points) {
    return euclideanTetraVolume(points) * 6 * SQRT2;
  }

  function edgesByLength(vertices, target, tolerance = 1e-7) {
    const edges = [];
    for (let i = 0; i < vertices.length; i += 1) {
      for (let j = i + 1; j < vertices.length; j += 1) {
        if (Math.abs(V.distance(vertices[i], vertices[j]) - target) <= tolerance) edges.push([i, j]);
      }
    }
    return edges;
  }

  function faceNormal(vertices, face) {
    const a = vertices[face[0]];
    const b = vertices[face[1]];
    const c = vertices[face[2]];
    return V.unit(V.cross(V.sub(b, a), V.sub(c, a)));
  }

  function orderFace(vertices, indices) {
    const centre = V.centroid(indices.map((index) => vertices[index]));
    const normal = faceNormal(vertices, indices);
    const first = V.unit(V.sub(vertices[indices[0]], centre));
    const second = V.unit(V.cross(normal, first));
    return [...indices].sort((a, b) => {
      const va = V.sub(vertices[a], centre);
      const vb = V.sub(vertices[b], centre);
      const angleA = Math.atan2(V.dot(va, second), V.dot(va, first));
      const angleB = Math.atan2(V.dot(vb, second), V.dot(vb, first));
      return angleA - angleB;
    });
  }

  function orientFacesOutward(mesh) {
    const centre = V.centroid(mesh.vertices);
    mesh.faces = mesh.faces.map((face) => {
      const ordered = orderFace(mesh.vertices, face);
      const faceCentre = V.centroid(ordered.map((index) => mesh.vertices[index]));
      const normal = faceNormal(mesh.vertices, ordered);
      return V.dot(normal, V.sub(faceCentre, centre)) < 0 ? [...ordered].reverse() : ordered;
    });
    return mesh;
  }

  function regularTetrahedron(edge = 1) {
    const scale = edge;
    const vertices = basisNames.map((name) => V.scale(quadrayBasis[name], scale));
    const faces = [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]];
    return orientFacesOutward({
      id: 'tetrahedron',
      name: 'Regular tetrahedron',
      vertices,
      edges: edgesByLength(vertices, edge),
      faces
    });
  }

  function regularOctahedron(edge = 1) {
    const radius = edge / SQRT2;
    const vertices = [
      [radius, 0, 0], [-radius, 0, 0],
      [0, radius, 0], [0, -radius, 0],
      [0, 0, radius], [0, 0, -radius]
    ];
    const faces = [];
    for (const x of [0, 1]) {
      for (const y of [2, 3]) {
        for (const z of [4, 5]) faces.push([x, y, z]);
      }
    }
    return orientFacesOutward({
      id: 'octahedron',
      name: 'Regular octahedron',
      vertices,
      edges: edgesByLength(vertices, edge),
      faces
    });
  }

  function cuboctahedron(edge = 1) {
    const component = edge / SQRT2;
    const vertices = [];
    for (const zeroIndex of [0, 1, 2]) {
      for (const a of [-component, component]) {
        for (const b of [-component, component]) {
          const point = [0, 0, 0];
          const values = [a, b];
          let cursor = 0;
          for (let axis = 0; axis < 3; axis += 1) {
            if (axis !== zeroIndex) point[axis] = values[cursor++];
          }
          vertices.push(point);
        }
      }
    }
    const squareFaces = [];
    for (let axis = 0; axis < 3; axis += 1) {
      for (const sign of [-1, 1]) {
        const indices = vertices.map((point, index) => ({ point, index }))
          .filter(({ point }) => Math.abs(point[axis] - sign * component) < EPSILON)
          .map(({ index }) => index);
        squareFaces.push(indices);
      }
    }
    const triangleFaces = [];
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const indices = vertices.map((point, index) => ({ point, index }))
            .filter(({ point }) => Math.abs(sx * point[0] + sy * point[1] + sz * point[2] - 2 * component) < EPSILON)
            .map(({ index }) => index);
          triangleFaces.push(indices);
        }
      }
    }
    return orientFacesOutward({
      id: 'cuboctahedron',
      name: 'Vector equilibrium / cuboctahedron',
      vertices,
      edges: edgesByLength(vertices, edge),
      faces: [...squareFaces, ...triangleFaces]
    });
  }

  function regularIcosahedron(edge = 1) {
    const scale = edge / 2;
    const vertices = [];
    for (const a of [-1, 1]) {
      for (const b of [-PHI, PHI]) {
        vertices.push([0, a * scale, b * scale]);
        vertices.push([a * scale, b * scale, 0]);
        vertices.push([b * scale, 0, a * scale]);
      }
    }
    const edges = edgesByLength(vertices, edge);
    const edgeSet = new Set(edges.flatMap(([a, b]) => [`${a}:${b}`, `${b}:${a}`]));
    const faces = [];
    for (let i = 0; i < vertices.length; i += 1) {
      for (let j = i + 1; j < vertices.length; j += 1) {
        if (!edgeSet.has(`${i}:${j}`)) continue;
        for (let k = j + 1; k < vertices.length; k += 1) {
          if (edgeSet.has(`${i}:${k}`) && edgeSet.has(`${j}:${k}`)) faces.push([i, j, k]);
        }
      }
    }
    return orientFacesOutward({ id: 'icosahedron', name: 'Regular icosahedron', vertices, edges, faces });
  }

  function ivmDirections(edge = 1) {
    const vertices = cuboctahedron(edge).vertices;
    return vertices.map((vector, index) => ({
      vector,
      opposite: vertices.findIndex((candidate) => V.distance(candidate, V.scale(vector, -1)) < EPSILON),
      index
    }));
  }

  function fccPoints(span = 2, nearestDistance = 1) {
    const scale = nearestDistance / SQRT2;
    const vertices = [];
    for (let x = -span; x <= span; x += 1) {
      for (let y = -span; y <= span; y += 1) {
        for (let z = -span; z <= span; z += 1) {
          if ((x + y + z) % 2 === 0) vertices.push([x * scale, y * scale, z * scale]);
        }
      }
    }
    return { vertices, edges: edgesByLength(vertices, nearestDistance) };
  }

  function frequencyTriangle(frequency = 1) {
    const n = Math.max(1, Math.min(32, Math.round(frequency)));
    const vertices = [];
    const lookup = new Map();
    for (let row = 0; row <= n; row += 1) {
      for (let column = 0; column <= n - row; column += 1) {
        const x = (column + row * 0.5) / n - 0.5;
        const y = (row * SQRT3 / 2) / n - SQRT3 / 6;
        lookup.set(`${row}:${column}`, vertices.length);
        vertices.push([x, y, 0]);
      }
    }
    const edges = [];
    const connect = (aRow, aColumn, bRow, bColumn) => {
      const a = lookup.get(`${aRow}:${aColumn}`);
      const b = lookup.get(`${bRow}:${bColumn}`);
      if (a !== undefined && b !== undefined) edges.push(a < b ? [a, b] : [b, a]);
    };
    for (let row = 0; row <= n; row += 1) {
      for (let column = 0; column <= n - row; column += 1) {
        connect(row, column, row, column + 1);
        connect(row, column, row + 1, column);
        connect(row, column, row + 1, column - 1);
      }
    }
    const uniqueEdges = [...new Map(edges.map((edge) => [edge.join(':'), edge])).values()];
    return { vertices, edges: uniqueEdges, frequency: n, smallTriangles: n * n };
  }

  function tetraOctaFragment(edge = 1) {
    const octa = regularOctahedron(edge);
    const vertices = octa.vertices.map((point) => [...point]);
    const tetrahedra = [];
    const height = Math.sqrt(2 / 3) * edge;
    for (const face of octa.faces) {
      const faceCentre = V.centroid(face.map((index) => vertices[index]));
      let normal = faceNormal(vertices, face);
      if (V.dot(normal, faceCentre) < 0) normal = V.scale(normal, -1);
      const apexIndex = vertices.length;
      vertices.push(V.add(faceCentre, V.scale(normal, height)));
      tetrahedra.push([...face, apexIndex]);
    }
    return {
      vertices,
      edges: edgesByLength(vertices, edge),
      octahedron: [0, 1, 2, 3, 4, 5],
      tetrahedra,
      faces: octa.faces
    };
  }

  function meshStats(mesh) {
    return Object.freeze({
      vertices: mesh.vertices.length,
      edges: mesh.edges.length,
      faces: Array.isArray(mesh.faces) ? mesh.faces.length : 0
    });
  }

  function jitterbugStages(edge = 1) {
    return Object.freeze([
      { id: 've', label: 'Vector equilibrium', posture: 'Expanded reference stage', mesh: cuboctahedron(edge) },
      { id: 'ico', label: 'Icosahedral guide', posture: 'Fivefold-symmetry orientation', mesh: regularIcosahedron(edge) },
      { id: 'octa', label: 'Octahedral guide', posture: 'Contracted fourfold stage', mesh: regularOctahedron(edge) },
      { id: 'tetra', label: 'Tetrahedral guide', posture: 'Minimum-system stage', mesh: regularTetrahedron(edge) }
    ]);
  }

  return Object.freeze({
    TAU,
    SQRT2,
    SQRT3,
    PHI,
    EPSILON,
    BASIS_COMPONENT,
    SQRT6_OVER_4,
    V,
    quadrayBasis,
    basisNames,
    canonicalQuadray,
    quadrayToXYZ,
    euclideanTetraVolume,
    tetravolume,
    edgesByLength,
    faceNormal,
    orderFace,
    regularTetrahedron,
    regularOctahedron,
    cuboctahedron,
    regularIcosahedron,
    ivmDirections,
    fccPoints,
    frequencyTriangle,
    tetraOctaFragment,
    meshStats,
    jitterbugStages
  });
});
