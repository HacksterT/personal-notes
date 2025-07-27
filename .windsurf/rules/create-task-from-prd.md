---
trigger: manual
---

# Rule: Generating a Task List from a PRD

## Goal

To guide an AI assistant in creating a detailed, step-by-step task list in Markdown format based on an existing Product Requirements Document (PRD). The task list should guide a developer through implementation.

## Output

- **Format:** Markdown ([.md](cci:7://file:///home/hackstert/projects/personal-notes/Readme.md:0:0-0:0))
- **Location:** `/tasks/`
- **Filename:** `tasks-[prd-file-name].md` (e.g., `tasks-prd-user-profile-editing.md`)

## Process

1.  **Receive PRD Reference:** The user points the AI to a specific PRD file
2.  **Analyze PRD:** The AI reads and analyzes the functional requirements, user stories, and other sections of the specified PRD.
3.  **Assess Current State:** Review the existing codebase to understand existing infrastructure, architectural patterns and conventions. Also, identify any existing components or features that already exist and could be relevant to the PRD requirements. Then, identify existing related files, components, and utilities that can be leveraged or need modification.
4.  **Phase 1: Generate Parent Tasks ONLY:**
    - Based on the PRD analysis and current state assessment, create the file and generate ONLY the main, high-level parent tasks required to implement the feature.
    - Do NOT include any subtasks at this stage.
    - Use your judgment on how many high-level tasks to use (typically 5-8).
    - Present these parent tasks to the user in the specified format.
    - Inform the user: "I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed."
5.  **Wait for Confirmation:** Pause and wait for the user to respond with "Go".
6.  **Phase 2: Generate Sub-Tasks in Batches:**
    - Once the user confirms, break down parent tasks into smaller, actionable sub-tasks in batches of 2 parent tasks at a time.
    - For each parent task in the current batch:
      - Create 5-15 detailed subtasks that logically follow from the parent task
      - Include specific implementation details (function names, file paths, etc.)
      - Reference existing codebase patterns and conventions
      - Make subtasks concrete and actionable
    - After completing subtasks for 2 parent tasks, ask: "I've detailed subtasks for [Task X.0] and [Task Y.0]. Should I continue with the next set of tasks?"
    - Wait for user confirmation before proceeding to the next batch
7.  **Identify Relevant Files:** Based on the tasks and PRD, identify potential files that will need to be created or modified. List these under the `Relevant Files` section, including corresponding test files if applicable.
8.  **Generate Final Output:** Combine the parent tasks, sub-tasks, relevant files, and notes into the final Markdown structure.
9.  **Save Task List:** Save the generated document in the `/tasks/` directory with the filename `tasks-[prd-file-name].md`, where `[prd-file-name]` matches the base name of the input PRD file.

## Subtask Quality Guidelines

When creating subtasks in Phase 2, ensure they meet these quality criteria:

1. **Specific and Actionable**:

   - Include concrete implementation details (function names, class names, file paths)
   - Specify parameters, return values, and data structures where relevant
   - Use precise verbs that describe the exact action required

2. **Logically Sequenced**:

   - Order subtasks in a natural development progression
   - Ensure each task builds upon previous ones
   - Group related functionality together

3. **Codebase-Aware**:

   - Reference existing patterns and conventions in the codebase
   - Mention specific files or components to use as templates
   - Follow established naming conventions and architectural patterns

4. **Comprehensive**:

   - Include testing tasks alongside implementation tasks
   - Cover error handling, edge cases, and validation
   - Address configuration, logging, and monitoring needs

5. **Implementation-Focused**:
   - Provide enough detail that a junior developer could implement without additional guidance
   - Include specific algorithms or approaches where relevant
   - Reference libraries or tools to use for implementation

Examples of good subtasks:

- "Create `PreprocessingService.normalize_text(text: str) -> str` function that removes extra whitespace and normalizes line endings"
- "Implement error handling in `content_processor.py` using the existing logging pattern from [analysis_service.py](cci:7://file:///home/hackstert/projects/personal-notes/backend/services/analysis_service.py:0:0-0:0)"
- "Add unit tests for the sentence boundary detection with theological abbreviations (e.g., 'St.', 'Rev.')"

## Output Format

The generated task list _must_ follow this structure:

```markdown
## Relevant Files

- `path/to/potential/file1.ts` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/file1.test.ts` - Unit tests for `file1.ts`.
- `path/to/another/file.tsx` - Brief description (e.g., API route handler for data submission).
- `path/to/another/file.test.tsx` - Unit tests for `another/file.tsx`.
- `lib/utils/helpers.ts` - Brief description (e.g., Utility functions needed for calculations).
- `lib/utils/helpers.test.ts` - Unit tests for `helpers.ts`.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Parent Task Title
  - [ ] 1.1 Create `ServiceName.methodName(param: type) -> returnType` that handles specific functionality
  - [ ] 1.2 Implement error handling using try/catch with logging following pattern in existing_file.py
  - [ ] 1.3 Add configuration options in config.json for feature toggles and thresholds
  - [ ] 1.4 Write unit tests covering normal operation and edge cases
- [ ] 2.0 Parent Task Title
  - [ ] 2.1 Extend existing Component in path/to/component.jsx to support new feature
  - [ ] 2.2 Create API endpoint handler in api/routes/endpoint.js with validation
```

## Interaction Model

The process requires two types of user confirmation:

1. After Phase 1 (parent tasks): Wait for "Go" before generating any subtasks
2. During Phase 2 (subtasks): Process parent tasks in batches of 2, waiting for confirmation between batches

## Target Audience

Assume the primary reader of the task list is a **junior developer** who will implement the feature with awareness of the existing codebase context.
