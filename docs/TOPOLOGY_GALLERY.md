# SIMPLEX-001 — The Topology Gallery

Three independently registered exhibits extend v0.7.0. All calculations concern abstract simplicial complexes on at most four labelled vertices A,B,C,D, not a geometric or quantum code claim.

## Simplex Builder

Nonempty simplex ID is a four-bit vertex subset (1..15). Complex mask has bit id-1 for each included simplex. The empty complex is accepted. A valid complex contains every nonempty face of every simplex. Add one simplex at a time, only after its faces exist; remove only if no coface remains. Failed changes preserve state. Full complex mask is 32767. Presentation uses a schematic tetrahedral projection. A 3-simplex is represented explicitly by a textual filled-interior indicator, not merely by drawing four triangles.

## Boundary Studio

Increasing vertex order is the oriented basis; reversing orientation multiplies by -1. Boundary is the alternating sum of one-vertex deletions, ordinary boundary of a vertex is zero. In GF(2), -1=1; in GF(3), -1=2. Exact signed integer terms are shown alongside their field residues. Applying boundary again cancels the terms in either field. Inspect edge, triangle and tetrahedron. This checks finite examples and implements the standard algebraic identity; it is not a machine-checked general theorem.

## Homology Laboratory

Ordinary unreduced homology over GF(2) or GF(3). Chain groups have the oriented simplices as basis. Boundary matrices use rows for lower-dimensional faces and columns for higher-dimensional simplices. Gaussian elimination with exact field operations computes ranks. Betti numbers beta_k = dim C_k - rank d_k - rank d_(k+1); d_0 and d_4 have rank zero. Empty complex has all Betti numbers zero. Euler characteristic is alternating simplex count. The chain identity is checked for both adjacent matrix products.

| Example | Betti (0,1,2,3) |
|---|---|
| Empty | 0,0,0,0 |
| Four points | 4,0,0,0 |
| Tree | 1,0,0,0 |
| Triangle loop | 1,1,0,0 |
| Filled triangle | 1,0,0,0 |
| Tetrahedral surface | 1,0,1,0 |
| Filled tetrahedron | 1,0,0,0 |
| Two disjoint edges | 2,0,0,0 |
| Tetrahedral wireframe | 1,3,0,0 |

Cycle witness is the oriented boundary of ABC (rim) or ABCD (surface) as a chain in the selected complex. Compute whether its boundary vanishes and independently enumerate the image of the next boundary to establish whether it is a boundary (at most 3^6 coefficient vectors). The same rim or surface is a cycle in both complexes, but represents a nontrivial class only when the corresponding filling is absent. A tetrahedral wireframe and surface share the same graph but not the same homology.

## Verification and limits

Enumerate all 32768 masks independently for downward closure. For every valid complex and both fields, independently construct incidence matrices by deleting vertices, enumerate all vectors in each boundary kernel, derive ranks by rank-nullity and compare with production elimination. Check Euler identity and boundary composition. Test both signs for every simplex, explicit cycle witnesses, malformed records, state isolation and actual browser controls. There are 167 valid masks including empty; the empty face is implicit for nonempty complexes and not a chain basis element. No higher-dimensional, arbitrary-complex, integral torsion, persistent homology or QEC claims. Public mathematical references in SOURCES.md. No vendor changes or runtime dependencies.

Owner acceptance: build a surface then fill it, reject illegal removals, reverse orientations in both fields, check the three dimensions, compare rim/fill and shell/fill, restore a saved lab, test mobile/offline and legacy Concentric. Require exact-head review, green CI and deployed smoke check before tagging v0.8.0.
