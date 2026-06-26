---
name: parametros-config
description: Use when implementing or extending shareable tool configuration through URL query strings in this project, especially when calculator inputs, presets, filters, or other user-provided values should be reflected in the address bar and restored on page load using the shared query-string hook.
---

# Parametros Config

Use this skill when adding exportable/shareable configuration to an Arsenal do Corredor tool.

## Core Pattern

- Prefer the shared `useQueryStringState` hook from `@/hooks/use-query-string-state` for client components.
- Keep each tool's URL params small, explicit, and stable: examples include `pace`, `time`, `distance`, `strategy`, and `unit`.
- Use URL-safe parameter names in English/lowercase when they represent technical state already used by the code.
- Let `URLSearchParams` handle encoding. Do not manually concatenate encoded values.
- Update query params with `history.replaceState`, not navigation, for per-keystroke changes so typing does not add browser history entries.
- Remove a parameter when its controlled input becomes an empty string.

## Implementation Steps

1. Confirm the component is a client component.
2. Import the hook:

```tsx
import {useQueryStringState} from "@/hooks/use-query-string-state";
```

3. Replace local string state with the hook:

```tsx
const {values, setValue, setValues} = useQueryStringState({
	pace: initialPace,
	time: initialTime,
});

const paceInput = values.pace;
const timeInput = values.time;
```

4. Update inputs through `setValue`:

```tsx
<Input
	value={paceInput}
	onChange={event => setValue("pace", event.target.value)}
/>
```

5. Update presets or multi-field actions through `setValues`:

```tsx
setValues({pace: preset.pace, time: preset.time});
```

6. Keep the calculation based on the controlled values from the hook, so restored URL params immediately drive the result.

## Expected Behavior

- Typing `pace` and `time` updates the current route query string.
- A value like `01:15:00` appears encoded in the URL as `01%3A15%3A00`.
- Opening a route with query params pre-fills the matching inputs.
- The tool continues calculating from restored values without requiring a button click.

Example for the distance calculator route:

```txt
/calculadoras/distancia-por-pace-e-tempo?pace=7&time=01%3A15%3A00
```

## Project Conventions

- Do not move business parsing into the hook. Keep parsing/formatting in calculator or domain helpers such as `lib/pace.ts`.
- Do not use the hook for server components.
- Do not replace canonical URLs or sitemap entries with query-string variants; query params represent shareable state, not separate indexable pages.
- For Base UI menus that contain inputs, stop keyboard event propagation on the inputs so the menu does not capture typing.
- After modifying code in this repo, run `graphify update .` unless the user explicitly says not to.
