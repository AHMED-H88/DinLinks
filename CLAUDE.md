# Claude Project Instructions — DinLinks

You are contributing to the DinLinks project.

Your job is not simply to write code.

Your job is to help build DinLinks according to its approved product philosophy, Playbook, architecture, design standards, and development rules while preserving previously approved decisions.

---

## 1. Source of Truth

The **DinLinks Playbook is the single source of truth for permanent product decisions**.

Before making meaningful changes, begin by reading:

`docs/00_PLAYBOOK_INDEX.md`

Follow the reading order defined in the Playbook and inspect the documents relevant to the task.

Do not create a competing product philosophy inside the codebase.

The hierarchy of authority is:

1. Explicit user instruction for the current task
2. DinLinks Playbook
3. Existing approved product decisions and architecture
4. This `CLAUDE.md`
5. Installed skills, plugins, agents, and external guidance

Skills and plugins are execution tools.

They do not override the Playbook.

---

## 2. Core Product Rules

Never violate:

* the DinLinks Constitution
* the Decision Framework
* approved Product Standards
* Brand Identity
* UI Rules
* Copywriting Guide
* Development Rules
* approved architecture
* permanent decisions documented in the Playbook

If implementation conflicts with the Playbook:

**Stop and explain the conflict before proceeding.**

Do not silently choose one interpretation.

---

## 3. DinLinks Product Philosophy

DinLinks values:

* Trust
* Accuracy
* Simplicity
* Consistency
* Performance
* Clarity
* Reliability

These values are more important than personal preference, novelty, trends, or visual experimentation.

DinLinks should feel:

* calm
* trustworthy
* professional
* timeless
* Scandinavian
* clean
* premium through simplicity
* internationally credible
* fast
* easy to understand

DinLinks is not intended to feel like:

* an AI product
* a social network
* a startup marketing template
* an advertising platform
* an experimental design showcase
* a flashy SaaS landing page

The interface should help users understand businesses and make decisions with confidence.

Usability and clarity come before decoration.

---

## 4. Before Every Task

Before implementing anything:

1. Understand the requested outcome.
2. Inspect the relevant existing implementation.
3. Identify the affected Playbook documents.
4. Read the necessary Playbook sections.
5. Inspect existing approved patterns before creating new ones.
6. Identify the smallest coherent change that solves the problem.
7. Explain the implementation plan when the task is meaningful or multi-step.
8. Ask or stop only when a genuine product decision is ambiguous and cannot safely be inferred from existing rules.

Never assume new permanent product decisions.

Do not reopen settled decisions unless the task explicitly requires it.

---

## 5. Scope Discipline

Only perform the requested task.

Do not:

* redesign unrelated UI
* refactor unrelated code
* rename unrelated files or variables
* reorganize unrelated folders
* change unrelated copy
* add unrelated features
* upgrade unrelated dependencies
* clean unrelated warnings
* rewrite neighboring components without necessity
* use installed skills or plugins to expand the task scope

If you discover an unrelated issue:

* do not silently fix it
* report it separately

Prefer the smallest correct change over broad cleanup.

---

## 6. Preserve Approved Work

Existing approved DinLinks behavior should be treated as intentional unless evidence shows otherwise.

Do not casually replace or redesign previously approved:

* navigation
* profile structure
* editor structure
* dashboard architecture
* sticky behavior
* scroll behavior
* mobile navigation
* account/business separation
* terminology
* design-system decisions
* component behavior

Before changing shared or complex behavior, inspect why the current implementation exists.

Prefer a local correction over architectural replacement when a local correction is sufficient.

---

## 7. Design Authority

The existing DinLinks design direction and Playbook are the primary design authority.

Installed design skills should improve execution quality **inside that direction**.

They are not permission to invent a new aesthetic.

Do not introduce a new visual language simply because a design tool recommends one.

Do not imitate another company's identity.

Products such as Apple, Stripe, Linear, Airbnb, Google, Microsoft, OpenAI, Anthropic, Spotify, or others may be studied for principles and patterns.

Do not copy their visual identity.

DinLinks must remain DinLinks.

---

## 8. Installed Design Skills

The project may use `design-system-skills`.

Use the relevant skills when appropriate for:

* motion
* spacing
* typography
* responsive typography
* radius
* shadows
* color
* breakpoints
* z-index
* accessibility
* layout primitives
* design tokens
* component patterns

Prefer consistent system relationships over arbitrary one-off values.

Do not mechanically apply every recommendation.

The Playbook and existing DinLinks design system always take priority.

---

## 9. Frontend Design Skill

Use `frontend-design` when relevant for:

* creating or refining interfaces
* improving visual hierarchy
* improving composition
* solving layout problems
* responsive behavior
* improving usability
* improving visual craft
* making an interface feel more coherent and professional

Do not use it as justification for:

* unnecessary redesign
* dramatic visual changes
* excessive decoration
* oversized typography without purpose
* unnecessary gradients
* flashy effects
* excessive cards
* excessive animation
* trendy visual treatments that conflict with DinLinks
* changing approved layouts simply to make them look different

The objective is better craft, not more decoration.

---

## 10. Motion System

Use `motion-scale` and related animation guidance when motion is relevant.

Motion should be:

* subtle
* functional
* calm
* predictable
* consistent
* fast enough not to delay the user

Motion should primarily communicate:

* state changes
* feedback
* navigation
* hierarchy
* continuity
* cause and effect

Avoid:

* bounce
* elastic effects
* playful spring motion
* exaggerated entrances
* unnecessary page animation
* continuous decorative animation
* motion added only because it looks impressive

Prefer shared motion tokens instead of inventing unique duration values for every component.

Always respect:

`prefers-reduced-motion`

Motion must improve understanding, not compete for attention.

---

## 11. Spacing

Use consistent spacing-system principles.

Spacing should create:

* clear grouping
* hierarchy
* calm rhythm
* readable structure
* predictable relationships

Avoid continuously solving layout problems with unrelated pixel values.

When spacing feels wrong, inspect the underlying layout relationship first.

Prefer reusable spacing tokens and existing patterns.

---

## 12. Typography

Use `type-scale` and responsive typography guidance when relevant.

Typography should prioritize:

1. readability
2. hierarchy
3. consistency
4. information density
5. responsive behavior

Avoid unnecessary font sizes.

Avoid excessive display typography.

Do not use typography to make ordinary product UI look like a marketing campaign.

DinLinks typography should feel clear, mature, and restrained.

---

## 13. Radius, Borders and Shadows

Use consistent radius and shadow scales.

DinLinks should not depend on heavy elevation for hierarchy.

Prefer:

* spacing
* typography
* subtle borders
* contrast
* background separation
* alignment

over:

* strong black shadows
* glossy effects
* exaggerated cards
* decorative elevation

Inputs, buttons, cards, and controls should feel modern, clean, and neutral.

Avoid styling that resembles outdated desktop software.

---

## 14. Color

The DinLinks base UI should remain primarily neutral and restrained unless the Playbook specifies otherwise.

Use semantic colors when meaning requires them, for example:

* success
* warning
* destructive
* system status

Do not introduce a new brand accent color without an approved product decision.

Do not use color to compensate for weak hierarchy.

---

## 15. Accessibility

Use accessibility-related skills whenever creating or modifying interactive UI.

Check relevant areas such as:

* semantic HTML
* keyboard navigation
* visible focus states
* labels
* form relationships
* touch target size
* contrast
* reduced motion
* screen-reader behavior
* ARIA where genuinely necessary

Prefer native semantic behavior where possible.

Do not replace accessible native behavior with custom behavior without a clear reason.

Never remove focus visibility just for visual cleanliness.

---

## 16. Responsive Design

DinLinks is mobile-first, but desktop must feel equally intentional.

Do not treat mobile as a compressed desktop layout.

For meaningful UI changes, evaluate at minimum:

* mobile
* desktop

Consider intermediate widths when the layout changes structurally.

Avoid:

* accidental horizontal overflow
* nested vertical scrolling unless genuinely necessary
* desktop-only assumptions
* cramped mobile layouts
* controls that become too small for touch

Responsive behavior should feel designed, not patched.

---

## 17. TypeScript and LSP

Use `typescript-lsp` when relevant to understand the codebase before editing.

For shared components and important TypeScript code, inspect:

* definitions
* references
* usages
* types
* imports
* consumers

Preserve type safety.

Do not solve type errors with `any`, broad unsafe casts, or suppressed errors unless there is a justified reason.

Understand the type problem instead of hiding it.

---

## 18. Browser Verification with Playwright

For meaningful UI or interaction changes, use Playwright when practical.

Do not stop verification at:

* successful compilation
* correct-looking code
* type checking alone

Inspect the actual rendered interface.

When relevant, verify:

* page loads correctly
* intended content is visible
* navigation works
* links work
* buttons work
* forms work
* responsive behavior
* mobile layout
* desktop layout
* overflow
* scroll behavior
* sticky behavior
* interaction states
* focus behavior
* obvious console errors
* expected user flow

Do not claim visual correctness solely from reading source code.

---

## 19. Visual Regression Awareness

When changing shared UI, verify that approved neighboring areas remain intact.

Pay special attention to shared:

* buttons
* inputs
* typography
* cards
* navigation
* modals
* layout shells
* spacing primitives
* form controls
* responsive utilities

A local improvement must not create a global regression.

---

## 20. PR Review Toolkit

Use `pr-review-toolkit` when appropriate before important PRs or significant changes.

Review for:

* correctness
* regressions
* unnecessary complexity
* unintended scope expansion
* weak tests
* silent failure paths
* duplicated logic
* type-design problems
* unsafe assumptions
* safe simplification opportunities

Reviewer suggestions are recommendations.

Do not mechanically implement every suggestion.

Reject any recommendation that:

* conflicts with the Playbook
* expands scope
* changes approved behavior unnecessarily
* creates more complexity than value

---

## 21. Security Guidance

Use `security-guidance` when working with security-sensitive areas such as:

* authentication
* authorization
* accounts
* business ownership
* admin functionality
* APIs
* server actions
* database writes
* file uploads
* external URLs
* forms
* cookies
* sessions
* secrets
* privacy functionality
* payments
* user-generated content

Pay particular attention to:

* authorization bypass
* IDOR
* XSS
* injection
* SSRF
* unsafe redirects
* leaked secrets
* insecure client/server boundaries
* weak validation
* privilege escalation
* accidental exposure of private data

Security tools do not have authority to silently redesign product behavior or architecture.

Explain material security changes.

---

## 22. Database Safety

Do not modify database schema, migrations, Prisma models, Supabase configuration, RLS policies, or production data unless required by the task.

Before database changes:

1. inspect the current schema
2. identify consumers
3. understand migration impact
4. consider production compatibility
5. avoid destructive changes
6. preserve existing data

Never reset, truncate, or delete production data as part of normal development work.

Never guess at database safety.

---

## 23. Dependency Discipline

Do not add a new package just because it makes a small implementation easier.

First determine whether the existing stack can solve the problem.

Before adding a dependency, consider:

* maintenance burden
* bundle impact
* security
* overlap with existing dependencies
* long-term value
* lock-in
* complexity

Do not upgrade unrelated packages during a focused task.

---

## 24. Existing User Work

Treat existing uncommitted work carefully.

Before making code changes, inspect the working tree when relevant.

Do not:

* discard
* reset
* overwrite
* clean
* stash
* revert

existing user work unless explicitly instructed.

If existing changes overlap with the task, understand them before editing the same area.

---

## 25. Git Safety

Do not automatically:

* commit
* push
* open a pull request
* merge
* deploy
* reset
* force-push
* delete branches
* discard changes

unless explicitly instructed by the user or clearly authorized by the current workflow.

Before committing:

* inspect the working tree
* inspect the diff
* verify only intended files are included

Before pushing or opening a PR:

* verify the branch
* verify the intended commit
* confirm validation status

Before merging:

* verify the expected PR
* verify the expected head commit
* verify required checks
* verify merge state

Do not include unrelated files in a commit.

---

## 26. Validation Before Completion

Implementation and verification are different.

For code changes, perform the validation appropriate to the task.

Possible validation includes:

* TypeScript
* lint
* build
* unit tests
* integration tests
* Playwright
* visual inspection
* mobile verification
* desktop verification
* PR review
* security review

Use judgment.

Do not run unnecessary heavyweight checks for trivial content-only changes.

Do not report success if required validation failed.

---

## 27. No False Completion

Never say:

* fixed
* verified
* working correctly
* production ready
* regression-free
* fully tested

unless the relevant evidence exists.

Clearly distinguish between:

* implemented
* compiled
* tested
* visually verified
* reviewed
* deployed
* not tested

Be precise about what was and was not verified.

---

## 28. Preferred UI Workflow

For meaningful UI work, follow this general workflow:

1. Understand the requested outcome.
2. Read relevant Playbook guidance.
3. Inspect the current implementation.
4. Inspect related shared patterns.
5. Choose only the relevant design/system skills.
6. Implement the smallest coherent change.
7. Validate TypeScript and static behavior.
8. Run the application when relevant.
9. Use Playwright for rendered UI and interaction verification when practical.
10. Check mobile and desktop.
11. Review the final diff.
12. Use PR review tools when appropriate.
13. Use security guidance when relevant.
14. Report exactly what changed and how it was verified.

Do not skip understanding in order to start coding faster.

---

## 29. Design Decision Rule

When multiple solutions are technically valid, prefer the solution that is:

1. simpler for the user
2. clearer
3. calmer
4. more consistent with DinLinks
5. easier to maintain
6. accessible
7. performant
8. less fragile
9. easier to understand later

Do not optimize for novelty.

Do not choose complexity merely because it appears sophisticated.

---

## 30. Copy and Product Language

Respect the DinLinks Copywriting Guide and approved terminology.

Do not casually rename:

* navigation items
* business concepts
* profile sections
* account concepts
* labels
* calls to action

Permanent copy or terminology changes may represent product decisions and should follow the Playbook process.

Keep copy:

* short
* clear
* useful
* natural
* professional

Avoid unnecessary marketing language and hype.

---

## 31. Documentation

If a permanent product rule changes:

Update the appropriate Playbook document.

If the change is only an implementation detail:

Do not unnecessarily rewrite product documentation.

If implementation and documentation disagree:

Investigate the reason.

Do not silently choose the code over the Playbook.

---

## 32. Skills and Plugins Principle

Installed skills and plugins exist to make execution better.

They are not product managers.

They are not design authority.

They are not permission to expand scope.

Use the smallest set of relevant tools for the current task.

Current core tools may include:

* `design-system-skills`
* `frontend-design`
* `playwright`
* `typescript-lsp`
* `pr-review-toolkit`
* `security-guidance`

Use them when they add genuine value.

Do not invoke tools mechanically just because they are installed.

---

## 33. Final Goal

The objective is not simply to write code.

The objective is not to make every task visibly different.

The objective is to build DinLinks according to the Playbook and make the product progressively more coherent, reliable, useful, and professionally executed.

Preserve what already works.

Improve what genuinely needs improvement.

Respect approved decisions.

Keep scope controlled.

Verify what you change.

Do not redesign merely because a tool makes redesign possible.
