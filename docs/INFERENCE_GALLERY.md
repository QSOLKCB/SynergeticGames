# INFERENCE-001 — The Hidden Tetrahedron

Four independently registered exhibits extend v0.6.0. Classical binary parity factor graphs, not a quantum decoder. No hidden physical or probabilistic assumptions.

## Exact Oracle

Four binary variables A,B,C,D. Independent priors P(X=1)=p/4 with p in {1,2,3}. For each of sixteen worlds, integer weight is the product of p for 1 bits and (4-p) for 0 bits, divided by 256, multiplied by hard XOR indicators. The tree checks A=B, B=C, C=D; the tetrahedron has all six pairwise equality checks. Both permit exactly 0000 and 1111. The contradictory graph has A=B, B=C, A≠C, C=D and permits no assignments.

Sum the integer weights to get T. Evidence probability Z=T/256; each posterior marginal is sum of weights with that variable 1 divided by T. If T=0 no posterior is defined. The existing pinned ExactRational module represents reduced fractions. With priors (3,2,2,2)/4, surviving weights are 8 and 24, Z=1/8, and all marginal P(1)=3/4. Exact pair equality probability is 1; multiplying marginals would falsely imply a nonzero disagreement probability. Counts are exact bounded integers, not floating-point likelihood estimates.

## Message Tree and Hidden Tetrahedron

Sum-product uses binary64 normalized two-component messages, initialized uniformly. One round first computes every variable-to-factor message proportional to the local prior times previous incoming factor messages excluding the recipient factor. Then each pairwise XOR factor sends its other variable's incoming message, swapping components for parity 1. Updates are synchronous within each phase. Marginals normalize prior times all incoming factor messages. Zero normalizers are reported, never replaced with a uniform distribution.

Each round records the maximum absolute change over factor-to-variable message components. Message convergence means residual <=1e-9; at round zero no residual is defined. Fixed maximum 32 rounds, no damping, no early-stop or stochastic scheduling. The UI allows step or fixed budget. Exact comparison separately reports maximum absolute marginal error, unavailable when no exact posterior exists.

On the tree, all 81 prior tuples reach the exact result after four rounds (three edges plus a stability round). On the loopy tetrahedron, the default biased A prior is repeatedly reinforced by cycles. Exact P(1)=3/4 at every vertex, while BP approaches 1 and its residual approaches zero. A stable approximate solution is not proof of correctness. Uniform priors also demonstrate exact singleton marginals 1/2 while variables remain perfectly correlated.

## Contradiction Room

Uniform priors on A=B, B=C, A≠C, C=D yield Z=0 and zero compatible assignments, despite fixed uniform local BP messages. The exact posterior is undefined. The displayed BP values are local approximate beliefs, not a valid posterior. This explicitly separates message convergence from global consistency.

## Scope and acceptance

Independent tests: 243 exact cases against closed form, all 81 tree priors, directed message updates against an independently enumerated cavity oracle, counterexamples and malformed records. Browser acceptance adds all four labs, offline, mobile and save/restore. Check exact-head review, green CI, deployment and owner playthrough before tagging. Information Gallery maximin decisions are separate; no information gain or decision utility equivalence is claimed. A QEC extension requires its own syndrome model, noise model, logical criterion and validation. Public background: Knoll arXiv:2209.05464. No copied code or private research.
