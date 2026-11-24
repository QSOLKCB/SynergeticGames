# EPISTEMIC-001 — The Information Gallery

Three independently registered labs extend the tagged v0.5.0 museum. These are local, fictional finite models, not techniques for influencing actual visitors. All actions are explicit and reversible via reset/rewind. Save records include the scenario for reproducibility; the browser is not a secrecy/security boundary.

## Observer Room

A fixed two-bit world (A,B). Pip initially observes A only; Mica observes B only. Switching viewpoints changes neither truth nor any information set. Sharing one's original observation makes that bit known to both. The receiver's possible-world set consists of all four worlds consistent with its observations; unknown bits display as question marks. Sharing both yields singleton sets. Truth is always retained. New trial or rewind restores the private observation structure. The visitor can inspect both views, but each rendered view is computed from its own information set.

## Evidence Ledger

A fixed three-bit world (A,B,C). Clues are A, B, A XOR B, A again and C. Values are generated from the fixed truth, never provided by an imported record. Each reveal intersects the current possible worlds with the clue constraint. A clue can be truthful yet redundant. The same set of clues has an order-independent final intersection; intermediate cardinalities may differ. Undo removes the last clue and recomputes from scratch. Completion requires a singleton and at least one redundant reveal. All eight worlds and all 326 distinct ordered clue prefixes (including empty) are tested against an independent truth table. No prior distribution, posterior probabilities, entropy or BP is asserted.

## Disclosure Theatre

An original two-stage toy extensive decision tree inspired by the public abstract of Artemov and Prud'homme, arXiv:2611.17084v1. It is not a reproduction of their general framework or theorem.

B has a fixed plan (B1,B2), each bit 0 or 1. Before each stage A chooses, B reveals one distinct plan bit truthfully. B's disclosure schedule can be (B1,B2) or (B2,B1). A considers all plans consistent with explicitly revealed bits; A does not infer from the schedule selection policy itself. At stage i, A can choose safe (payoff 2 for any plan) or risky (payoff 4 if Bi=1, else 0). A uses the maximum of the minimum payoffs across possible plans; ties choose safe. Decisions are irreversible within a trial. B's score is the number of risky choices. The visitor sees the sender setup; the simulated receiver uses only its explicitly revealed constraints.

Compare exhaustively evaluates both complete schedules for the selected plan, choosing the higher B score (ties use B1 first). The uniform-order benchmark is the exact mean of the two scores, not a Monte Carlo sample. It is a conditional comparison for the chosen fixed plan, not a claim of globally optimal persuasion. For plan 11: B1 then B2 produces two risky choices (A payoff 8); B2 then B1 produces safe then risky (A payoff 6). Both end with the same singleton information set. Best B score 2 versus uniform mean 3/2. Rewind and compare. No disclosure is false and no real person's preferences are modelled.

## Verification and scope

Independent tests enumerate all observer cases, clue orders, plan subsets and schedules; browser acceptance covers the three labs and all prior exhibits, export/restore, mobile and offline. Exact rational probability inference and sum-product BP remain INFERENCE-001. No private research is published. Run the existing Node and pinned Chromium suites and inspect exact-head review, main CI, deployment and owner playthrough before tagging v0.6.0. 
