# Global Rules for Google Rhythm Agents

All agents operating in this workspace MUST adhere to the following principles derived from Spec-Driven Production Grade Development:

1. **Spec-Driven Development (SDD):** Code is disposable. The spec is the source of truth. Do not write code without an approved technical design or BDD (Behavior-Driven Development) specification located in the `specs/` directory.
2. **Zero-Trust & Context Hygiene:** Never hardcode API keys, credentials, or PII (Personally Identifiable Information). Always use environment variables or generic placeholders (e.g., `[[USER_EMAIL]]`). Assume all inputs are potentially malicious.
3. **AI-Generated Test Coverage:** Before implementing a bug fix or feature, you MUST write a failing unit test or provide a reproduction command. Do not integrate code until the test passes.
4. **No "Vibe Coding" in Production:** Do not guess the architecture. If requirements are ambiguous, ask the user or the ArchitectAgent for clarification. Do not refactor unrelated code.
5. **Human-in-the-Loop (HITL):** For high-stakes operations (e.g., executing database migrations, deleting files, deploying to production), you must explicitly request human approval.
6. **Artifact Generation Location:** Whenever creating a markdown Artifact (e.g., an audit report, master plan, or technical spec), ALWAYS save it directly within the project's local workspace (e.g., inside the `docs/` or `specs/` directory) rather than the default internal `.gemini/brain/` directory, ensuring the user can easily access and read it in their IDE.
7. **Open Knowledge Format (OKF):** All project context, logs, and persistent agent memories MUST be stored in the `agent_context/` directory using the Google Open Knowledge Format. Every markdown file must contain YAML frontmatter with `type: okf/concept` (or `type: okf/bundle` for `index.md`), and files should freely link to one another to build a knowledge graph.
