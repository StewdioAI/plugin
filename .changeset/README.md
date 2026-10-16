# Changesets

Every push to `main` is released automatically. CI adds a patch changeset using
the triggering commit's subject, applies all pending changesets, synchronizes the
plugin manifests, and commits the version and changelog before tagging and
publishing the verified ZIP. No release PR or npm publication is involved.

For a specific release note or a larger bump, run `npm run changeset` and select
`plugin`, or create a Markdown file here:

```md
---
"plugin": minor
---

Describe the change for plugin users.
```

Commit the changeset with the change. CI applies the highest requested bump;
the automatic patch entry ensures that changes without a changeset still ship.
Do not bump versions or consume changesets in feature branches. For local
verification in a disposable checkout, `npm run version:plugin` applies pending
changesets, synchronizes both plugin manifests, and updates the npm lockfile.

See the [Changesets CLI documentation](https://changesets.dev/guide/cli).
