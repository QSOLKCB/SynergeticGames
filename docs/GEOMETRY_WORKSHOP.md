# QUADRAY-001 — The Geometry Workshop

Three new independent exhibits extend the v0.4.0 museum. Open Museum catalogue. All use the existing registry, reset, routes and versioned JSON records.

## Coordinate convention

D=1. The four basis vectors are (1,1,1), (1,-1,-1), (-1,1,-1), (-1,-1,1), each multiplied by sqrt(2)/4. This is the existing Synergetics 95 basis. A bounded integer tuple is canonicalised by subtracting its minimum; its XYZ numerator is (a+b-c-d,a-b+c-d,a-b-c+d). These numerators are invariant under a shared integer offset. Inverting (x,y,z) uses ((x+y)/2,(x-z)/2,(y-z)/2,0), then canonicalises. Matching parity is required for integer coordinates; this does not represent all real points with integers. Core input components and canonical span are bounded to 128, numerator components to 256. UI input components are -16..32 with span <=32; invalid transitions are rejected. Safe-integer arithmetic is exact in this domain; Cartesian rendering is approximate. View rotation does not alter coordinates.

## FCC / IVM builder

The 12 distinct permutations of (2,1,1,0) map to permutations of (+/-1,+/-1,0) in FCC integer indices, with physical scale 1/sqrt(2). Breadth-first traversal from origin, radius 0..3, generates unique sites and nearest-neighbour edges. Shell counts: 1,12,42,92; cumulative 1,13,55,147. Independent oracle enumerates parity-even triples with max absolute component <=r and sum of absolute components <=2r; adjacency uses squared distance 2. A finite patch boundary does not have all 12 neighbours. Select any generated site and inspect its Quadray address and degree; rotate the view.

## Cell Foundry

Tetrahedron vertices (0,0,0),(1,1,0),(1,0,1),(0,1,1); octahedron about (1,0,0) with six axis neighbours; cuboctahedron is the first FCC shell. All edges are D=1. Build each vertex, revealing edges and completed faces. Triangular faces are three-cliques for these specific solids; cuboctahedron square faces lie on the six axis planes. Each edge belongs to two faces. Integer determinant fan from a boundary vertex, divided by 2, yields exact reference tetravolumes 1,4,20; independent centroid-fan Cartesian oracle checks these. Concentric comparison translates each centroid to the same origin without rescaling. This is a comparison of solids, not a tiling or a Jitterbug mechanism. The view is a schematic orthographic projection.

## References and verification

Public mathematical references: Kirby Urner's Mapping_Quadrays.ipynb, Rendering_IVM.ipynb, QuadraysResearch.ipynb and Qvolume.ipynb, revision 8d30d18fa1dde164317f2e21ae7e6c29ab2060df. See SOURCES.md. No notebook code or artwork copied. Existing expedition and exhibit saves are unchanged.

Run Node and browser suites in README.md. Owner acceptance: construct and offset a Quadray, inverse/canonicalise, grow and inspect shells, build all three cells and compare volumes, rotate, save/reset/restore, check mobile/offline and legacy Concentric. Confirm exact-head review, main CI and deployment before tagging v0.5.0. No new physics or formal proof claimed.
