# Development Rules

## Purpose

This document defines how DinLinks should be developed.

Every contributor must follow these rules when making changes.

---

# Development Philosophy

Build with intention.

Every change should improve the product.

Never change code without understanding why it exists.

---

# Before Making Changes

Always:

- Understand the problem.
- Read the relevant Playbook chapter.
- Consider the user experience.
- Consider performance.
- Consider long-term maintainability.

Never implement features blindly.

---

# Consistency

New code should match the existing architecture.

Avoid creating multiple solutions for the same problem.

Consistency is more important than personal preference.

---

# Simplicity

Prefer the simplest solution that solves the problem well.

Avoid unnecessary abstractions.

Avoid overengineering.

---

# Performance

Every implementation should respect the Performance Standard.

Never introduce unnecessary rendering, API calls, or dependencies.

---

# Reusability

If a component or function may be used in multiple places:

Create it once.

Reuse it.

Avoid duplicate code.

---

# Breaking Changes

Never introduce breaking changes unless explicitly approved.

If a safer migration path exists, prefer it.

---

# UI Changes

Every UI change must follow:

- Constitution
- Brand Identity
- UI Rules

Never redesign components without a clear reason.

---

# Copy Changes

Every text change must follow the Copywriting Guide.

Never invent marketing language.

---

# SEO Changes

Every SEO improvement must follow the SEO Standard.

Never optimize rankings at the expense of user experience.

---

# Testing

Before considering work complete:

- Verify functionality.
- Check responsive behavior.
- Check performance impact.
- Ensure consistency with the Playbook.

Never assume code works without verification.

---

# Documentation

Major architectural decisions should be documented.

The Playbook should be updated whenever permanent standards change.

---

# Approval Rules

The following require explicit approval before implementation:

- Architecture changes
- Brand changes
- Navigation changes
- Major UI redesigns
- Database structure changes
- Changes to the Constitution

---

# Definition of Done

A task is complete only if:

- It solves the intended problem.
- It follows the Playbook.
- It does not reduce performance.
- It maintains consistency.
- It improves the product.

---

# Key Principle

Build for the next ten years, not just the next release.