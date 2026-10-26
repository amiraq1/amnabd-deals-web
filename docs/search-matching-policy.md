# Search matching policy (AMN-007)

## What the code does today

`matchesCorpus` (`src/lib/discovery.ts`) splits a query into token groups, then
requires every group to match at least one of its variants with
`corpus.includes(value)`.

So the semantics are: **AND across tokens, OR across variants, substring inside
the normalized corpus.** Arabic normalization (`src/lib/normalize.ts`) is applied
before comparison and is not the problem.

The consequence, from the audit's synthetic case:

```
matchesQuery('paid plan', 'ai')  →  true
```

because the two-letter token `ai` occurs inside `paid`. No user has been observed
hitting this; it is a precision concern, not a reproduced defect.

## Why this is a decision, not a bug fix

Every option changes what visitors see, and each one trades recall for precision:

| Option | Behaviour | Cost | Risk |
| --- | --- | --- | --- |
| **A. Keep substring** | `ai` matches `paid`, `openai`, `claim` | none | noisy short queries; the audit's example stays |
| **B. Word boundary** | token must match at a word boundary or after one | small | `openai` no longer matches `ai`; two-letter queries lose hits |
| **C. Boundary + prefix** | token matches at a boundary, or is a prefix of a word | small | `ai` matches `ai`, `aim`, `airtable` — better than A, still loose |
| **D. Minimum length rule** | queries under 3 chars keep substring; longer use boundaries | small | two rules to explain, but matches user expectation |

Arabic makes B and C less clean than they look: proclitics (`و`, `ب`, `ال`) attach
to the following word, so a strict `\b` is not a natural boundary in Arabic text.
Any boundary rule needs a test corpus that includes `الذكاء`, `بالذكاء`, `والذكاء`
before it can be trusted.

## Recommendation

**C, applied per token, with an Arabic-aware boundary check.** It fixes the
reported case (`ai` no longer matches inside `paid`) while keeping prefix search
that Arabic users rely on, and it does not need a minimum-length special case.

Do not ship it without a test corpus first. The corpus should assert, at minimum:

- `ai` does **not** match `paid plan`
- `ai` **does** match `openai` only if prefix matching is intended to include it — decide this explicitly, because it is the difference between C and B
- `ذكاء` matches `الذكاء` and `بالذكاء` (normalization strips the clitic? check)
- `C++` and `.NET` still match as protected symbols
- a filtered URL (`?q=...`) round-trips with the same result count before and after

## Status

**Implemented — policy C, word-start matching with Arabic clitics.**

`src/lib/normalize.ts` now exports `matchesToken`, and both `matchesQuery`
(synthetic path) and `matchesCorpus` (`src/lib/discovery.ts`, app path) go
through it, so the two cannot drift apart.

The rule in one line: a token matches when it **starts a word** — at a boundary
or as a prefix of a longer word. Arabic definite-article proclitics are allowed
in front (`ال`, `بال`, `وال`, `كال`, `فال`, `لل`), and nothing else is stripped.

Decisions taken, and now asserted in `tests/search-matching.test.mjs`:

| Query | Corpus | Result | Why |
| --- | --- | --- | --- |
| `ai` | `paid plan` | **no** | mid-word; the audit's reported case |
| `ai` | `ai`, `aim`, `airtable` | **yes** | exact, or prefix |
| `ai` | `openai` | **no** | documented cost of C: not a boundary, not a prefix |
| `ذكاء` | `الذكاء`, `بالذكاء`, `والذكاء`, `للذكاء` | **yes** | article clitics stripped |
| `رمجة` | `برمجة` | **no** | bare single-letter prefixes are not stripped |
| `c++`, `c#`, `.net` | exact symbol | **yes** | protected symbols unchanged |

If `ai` should match `openai` after all, that is a different policy (suffix
matching) and needs its own corpus — do not relax the boundary rule to get it.
