<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public PA views must use the server-side allowlisted numeric summary only, never individual snapshot records; this prevents personal information from reaching browser responses.
- Public PA summaries show exact counts by owner decision (16/10/2026), controlled by `SUPPRESS_SMALL_COUNTS` in `pa-public-summary.ts`; set it to `true` to hide counts of 1 to 4 and reduce small-group identification risk. Always omit specialty breakdowns and any per-patient field.
- Remove unused patient-bearing server functions when disabling their pages; hidden navigation alone does not prevent direct endpoint access.
- Use a focus-managed dialog for the small-screen navigation; keyboard dismissal and focus restoration must remain accessible.
- Keep operational AI input in a strict numeric aggregate schema and never import patient data into its form or service; this prevents identifiers from reaching the model.
- Run operational summaries through a POST server function and server-only Responses SDK helpers, consuming the streamed structured result; this keeps credentials private and returns a validated summary without altering snapshot data.
- Public shells must never query private PA endpoints; this prevents private records leaking through shared layouts.
- All manager data and AI calls require verified authentication and server-side authorization (`src/lib/manager-policy.server.ts`): the administrator (oldest confirmed account, or `PA_ADMIN_USER_IDS`) approves accounts through `app_metadata.gestor`, or ids are listed in `PA_MANAGER_USER_IDS`; deny by default, so new accounts must not inherit access to patient records. Never hardcode passwords or personal e-mails in the repository.
- Disabled surgical pages must have their data endpoints removed, not merely hidden; this closes direct endpoint access.
