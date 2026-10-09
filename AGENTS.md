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

- Keep patient list presentation in a shared PA component module, with a desktop table and smaller-screen cards fed by the same filtered rows; this preserves identical data, sorting, and exports across viewports.
- Use a focus-managed dialog for the small-screen navigation; keyboard dismissal and focus restoration must remain accessible.
- Keep operational AI input in a strict numeric aggregate schema and never import patient data into its form or service; this prevents identifiers from reaching the model.
- Run operational summaries through a POST server function and server-only Responses SDK helpers, consuming the streamed structured result; this keeps credentials private and returns a validated summary without altering snapshot data.
