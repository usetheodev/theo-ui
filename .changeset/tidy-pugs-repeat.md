---
"@theokit/ui": patch
---

Releases are cut by Changesets, so a published version is tagged and attested again.

Nothing about the package's API changes. What changes is how it reaches npm: the version was
previously typed into the manifest by hand and published by a `v*` tag, which put the version
number, the git tag and the artifact in three different hands. They drifted — npm served 1.4.0
and 1.4.1 while git's newest tag was v1.3.2, so two releases exist with no tag, no GitHub
release and no provenance attestation (usetheokit/theokit-ui#46).

The version is now derived from the changesets merged into it, and the same merge tags the
commit and publishes over OIDC trusted publishing. A consumer can verify that a tarball came
from this source at this commit rather than from whoever held a credential.
