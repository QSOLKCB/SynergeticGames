# MUSEUM-001C — The Volume Exchange

Open Museum catalogue → The Volume Exchange. Predict cube, tetrahedron or equal; measure and try again without penalty. Change radius in hundredths of a fixed length unit u (1..200); the buttons step by 25 hundredths with endpoint saturation. Three measurement modes compare the same solids. The scale of the drawings is shared and fixed for a given canvas size; changing units does not alter canvas geometry. The diagram is an orthographic wireframe, not a proof or a water-transfer simulation.

## Mathematical conventions

A cube of side R has volume R³. A regular tetrahedron of edge D=2R has volume sqrt(2) D³/12 = (2 sqrt(2)/3) R³. The physical ratio Vcube/Vtet is S3=sqrt(9/8), approximately 1.06066017178, regardless of positive R.

| Unit | Cube | Tetrahedron |
| --- | --- | --- |
| Fixed Cartesian u³ | R³ | (2 sqrt(2)/3) R³ |
| Current XYZ reference R³ | 1 | 1/S3 |
| Current IVM reference D-edged tetrahedron | S3 | 1 |

For any fixed physical volume, multiplying its numerical measure in R³ units by S3 gives its measure in D-edged tetravolumes; dividing converts back. The original Volume Bureau uses equal-edge tetrahedron units; when both reference edges are one u its cubic-to-tetra factor is 6 sqrt(2). Do not confuse the two conventions or infer a tiling relation.

The existing exact-rational engine represents R, R³, the rational coefficient of sqrt(2) and S3²=9/8 exactly. Irrational values and orthographic projection use binary64; displayed decimals are rounded to six places. The test oracle uses independent determinants of the actual coordinates: cube corners ±R/2, tetrahedron parity corners ±R/sqrt(2). It checks all 200 permitted radii and all edge lengths, rather than trusting the display formula. The drawing uses an equal-length orthonormal projection basis, one pixel scale and different centres.

## Registration and state

`measurement.volume-exchange`, exhibit version 1, is the first new model registered alongside the founding collection. State is {radius,unit,prediction,measured}; invalid records are rejected before replacing current state. Radius/units are independent of prediction; a new prediction hides the readings until measured again. Completion is derived from a correct measured prediction, never a supplied seal. Reset affects only this lab. No changes to the original expedition save or puzzle model. The guided route includes this exhibit before the original finale; existing imported route records retain their explicit order.

Public source: Kirby Urner's [Qvolume notebook](https://github.com/4dsolutions/School_of_Tomorrow/blob/8d30d18fa1dde164317f2e21ae7e6c29ab2060df/Qvolume.ipynb), pinned revision, section XYZ : IVM Conversion (S3). Original implementation and artwork by QSOL-IMC; no third-party code or images copied, no endorsement claimed.

## Acceptance

Node tests exercise actual registration, all radii/coordinates/units, draw-command identity across unit changes, prediction retries, bounds, reset, isolation, and atomic saves. Browser tests cover wrong/right predictions, canvas pixel identity across units, scaling, file restore/rejection, mobile touch, and offline operation. The existing Pages workflow regression and complete expedition/WAV tests remain. See exact candidate CI for execution evidence; no new physical theory or formal proof is claimed.
