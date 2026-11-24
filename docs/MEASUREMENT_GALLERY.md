# VOLUME-001 — The Measurement Gallery

Three original exhibits extend the v0.3.0 museum, without changing the existing Volume Exchange or Concentric save format. Open Museum catalogue. All use the reviewed registry, versioned JSON state, reset, explanations and guided routes.

## The Conversion Desk

Fix R=1 u, D=2 u. Positive inputs in quarters (1..48) represent either R³ cube units or D-edged regular tetrahedron units. XYZ→IVM multiplies by S3 = sqrt(9/8); IVM→XYZ multiplies by sqrt(8/9). The squared output is an exact rational (input² times the squared factor). Decimal outputs and specimen drawing are approximate. Predict larger or smaller, then convert. Changing the direction reinterprets the input as a new physical specimen; each individual conversion compares the same physical volume. This does not replace the original Volume Exchange, which varies the reference radius.

## The Pythagorean Transfer

Right triangle legs are integers 1..8, c = sqrt(a²+b²). Choose similar squares (k=1), similar right isosceles triangles (k=1/2), or similar rectangles of height twice their base (k=2). All three shapes in a trial use the same k. The exact area ledger transfers a and b once each into the target, with a bitmask preventing duplicate transfer. Changing either leg or the shape resets the ledger. The figures are drawn separately on a common scale, with an area bar rather than a claimed dissection or fluid simulation. This is an illustration of Euclid VI.31, not a proof by animation. The shoelace oracle computes areas from actual polygon vertices independently of the rational model.

## The TetraBook

Based on Kirby Urner's public TetraBook notebook at revision 8d30d18fa1dde164317f2e21ae7e6c29ab2060df. The notebook credits Alan Michelson and David Koski; preserve those acknowledgements. Original implementation uses coordinates with fixed D=2, R=1.

Let the hinge endpoints be A=(-1,0,0), B=(1,0,0); front and back cover tips C=(0,-sqrt(3),0), E=(0,sqrt(3),0). At angle theta from the front, the moving page tip is P=(0,-sqrt(3) cos(theta),sqrt(3) sin(theta)). All three triangles share the hinge, and each has three edges of length 2. The two tetrahedra ABCP and ABEP lie on opposite sides of the page in the interior of the sweep. Each has Cartesian volume sin(theta) u³ from the determinant, so each has IVM volume S3 sin(theta). The combined volume is twice the per-tetrahedron value.

At 0 and 180 degrees the tetrahedra are degenerate; at 90 degrees each reaches 1 cubic unit or S3 tetravolumes. At arccos(1/3) (about 70.529°) the front tetrahedron is regular, and at arccos(-1/3) (about 109.471°) the back tetrahedron is regular. Both have equal volume throughout the sweep; the other tetrahedron need not be regular at those angles. Analytic snap identifiers avoid rounding the regular angles to integer degrees. The controls move by integer degrees or use the named snaps. The projection is schematic, and numerical trigonometric quantities use binary64; endpoints and vertical position are explicitly exact. Independent determinant checks cover every integer degree and both snaps.

## Acceptance and scope

The default route includes the three new labs before the original Concentric finale; imported routes retain their explicit IDs and order. No existing IDs or schemas change. Eight standalone experiments are counted separately from the expedition. No source code or external assets from Kirby's notebooks are copied. No new physical theory, controller, WebGL or formal-proof claim.

Tests: run the existing Node suite and pinned browser suite in README.md; review exact SHA, CI and receipt. Owner should exercise the three new labs, both conversion directions, all shapes, endpoint/regular/vertical book positions, JSON export/restore, mobile and offline access; then confirm original Concentric and deployed site. Tag v0.4.0 only after review, post-merge CI and owner acceptance.
