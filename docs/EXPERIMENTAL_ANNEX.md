# RESEARCH-001 — The Experimental Annex

Public-mathematics fallback authorised by the roadmap. No permission to redistribute the privately circulated elastic-loop research has been established. No elastic-loop, gravitational-field or quantum model is reproduced here. Public background sources are in SOURCES.md.

## Quadrature Bench

Integrate x^2 or x^4 on [0,1] using composite midpoint or trapezoid rules. Fixed resolutions n=8,16,32,64,128. Use integer sums and the pinned ExactRational module. Reference integral 1/(p+1). Absolute exact error <=1/10000 is PASS, otherwise FAIL. Each row is an independent evaluation; finest row determines run outcome. Earlier failed rows remain recorded. Independent polynomial closed-form errors test all twenty configurations.

## Oscillator Laboratory

Dimensionless undamped oscillator x''=-x, m=k=1, initial x=1,v=0. Final time 1 or 2, resolutions n=8,16,32,64,128. Explicit Euler updates x and v from old values; symplectic Euler updates v first then x. Reference x=cos(t), v=-sin(t), stored as fixed binary64 constants for reproducibility. Report max absolute endpoint error and absolute energy drift from 1/2. Endpoint error <=0.01 is PASS. Energy drift is a separate diagnostic, not the acceptance criterion. No claim of long-time stability or physical validation. Independent matrix power and analytic Euler formula test all twenty configurations.

## Inference Sweep

Reuse the reviewed v0.7 classical pairwise XOR model. Sweep all 81 independent prior tuples with each numerator 1..3 over denominator 4. Choose tree, tetrahedron or contradictory cycle; fixed round budget 1,4,8,32. Record convergence count, accuracy count (max marginal error <=1e-6), converged-but-wrong count, undefined exact/BP counts, maximum error and first worst tuple. If all exact posteriors are undefined, accuracy is INCONCLUSIVE; otherwise PASS requires all 81 accurate. This is a deterministic grid, not a sample or a QEC decoder.

## Evidence contract

Each lab retains at most four completed runs as validated settings. No automatic eviction, including failed/inconclusive runs. Results are deterministic recomputations, not telemetry. Explicit reset clears the log; download evidence before resetting. Save exhibit preserves settings/history in the existing schema. A visitor completes the experiment by running it, not by forcing a PASS.

Download research evidence exports museum.research.evidence.v1 with schema, experiment ID, algorithm version, model Git blob 0cbdb7253be816775de96cefa72006865ecbccbc, exact released baseline commit 056c7d451017b370f75a9d2e189bc2fa3cd7846d, precision and limitations, and every run's settings, units, tolerance, rows and outcome. The model blob is tested against source bytes; the baseline identifies the reused inference and rational dependencies. No stochastic inputs, timestamps or personal identifiers. This is a model-source identity, not a claim that the complete executing deployment is cryptographically attested.

Load exhibit, route or evidence accepts the evidence record through bounded plain-data parsing. It recomputes every run using the current reviewed algorithm, compares all values and rejects missing, extra, modified or incompatible fields. Verification is read-only and does not replace existing lab state. Equality is exact for this algorithm version; binary64 cross-engine reproduction is not independently certified. No external calls, crypto attestation, digital signature or independent scientific certification is implied.

## Acceptance

Verify both methods and parameters, failed and inconclusive rows, four-run limit, evidence download/recompute and tamper rejection, save/reset/restore, mobile/offline and prior expedition. Require exact-head review, full Node and browser CI, deployment smoke check and owner acceptance before tagging. No new dependencies or private material.
