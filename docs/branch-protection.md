# Branch Protection

The repository is configured with a required `quality:gates` CI workflow. To make
the gates non-bypassable on GitHub, enable branch protection for the default
branch with these settings:

- Require a pull request before merging.
- Require approvals from Code Owners.
- Require status checks to pass before merging.
- Mark `quality:gates` as a required status check.
- Require branches to be up to date before merging.
- Do not allow bypassing the above settings.
- Restrict who can push directly to the protected branch.

Local scripts cannot prevent an administrator from bypassing GitHub protections.
This document is the repository-side contract for enforcing the gate in GitHub.
