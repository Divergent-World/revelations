# Expanded Tapestry Movements

## Goal

Expand the movement list beside each tapestry's reader image into a readable narrative outline. Each tapestry page should preserve its four- or five-part movement structure while giving every movement a concise title and explanatory paragraph drawn from the corresponding Obsidian canvas.

## Content sources

- Tapestries I and III–VI use the numbered narrative summary text boxes in their corresponding canvas files.
- Tapestry II uses the four movement titles and paragraphs supplied directly by the project owner:
  1. God marks out His people before the next wave of judgment.
  2. Heaven prepares judgment through liturgy.
  3. Creation itself begins to break apart.
  4. Judgment becomes demonic and militarized.
- Canvas wording may be lightly edited for readability, but the events, sequence, and theological emphasis must remain faithful to the source.

## Data model

Replace each `movements` string with an object containing:

```ts
type Movement = {
  label: string;
  title: string;
  description: string;
};
```

The generated `content/tapestries.json` file and its source arrays in `scripts/generate-content.mjs` will use this structure. No new content file or parsing system is needed.

## Presentation

- The shared tapestry viewer renders each movement as a numbered card with a title and paragraph.
- The cards remain beside the lead reader image on all six regular and embedded tapestry pages.
- The tapestry heading and homepage index continue to show the existing concise movement labels, joined by centered dots.
- Existing typography and responsive behavior remain intact, with small CSS adjustments for the longer card content.

## Validation

- Update relevant content validation or tests to assert that every movement has a non-empty title and description.
- Run the content tests, application build, and targeted browser checks for desktop and mobile layouts.
- Confirm all six tapestry pages render the intended movement count and Tapestry II shows exactly the supplied four movements.

## Scope

This change does not alter scene metadata, artwork mapping, scripture text, navigation, or the Obsidian vault.
