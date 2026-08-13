# Graph Report - /Users/alirahman/Desktop/test/revelations  (2026-08-13)

## Corpus Check
- 53 files · ~61,086 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 234 nodes · 289 edges · 22 communities (18 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Content Generation|Content Generation]]
- [[_COMMUNITY_Release Packaging|Release Packaging]]
- [[_COMMUNITY_Scripture and Artwork UI|Scripture and Artwork UI]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Page Routes|Page Routes]]
- [[_COMMUNITY_Artwork Zoom|Artwork Zoom]]
- [[_COMMUNITY_Site Chrome|Site Chrome]]
- [[_COMMUNITY_Local Development|Local Development]]
- [[_COMMUNITY_Reader Design|Reader Design]]
- [[_COMMUNITY_Static File Server|Static File Server]]
- [[_COMMUNITY_Scene Metadata|Scene Metadata]]
- [[_COMMUNITY_Deployment and Licensing|Deployment and Licensing]]
- [[_COMMUNITY_Movement Narratives|Movement Narratives]]
- [[_COMMUNITY_Agent Instructions|Agent Instructions]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_Content Tests|Content Tests]]
- [[_COMMUNITY_Content Exports|Content Exports]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `scripts` - 12 edges
3. `main()` - 10 edges
4. `getTapestry()` - 6 edges
5. `validateSceneMetadata()` - 6 edges
6. `Scene` - 5 edges
7. `assetUrl()` - 5 edges
8. `mapCanvasToSceneIds()` - 5 edges
9. `displayReference()` - 5 edges
10. `annotateWordsOfJesus()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `EmbeddedTapestryPage()` --calls--> `getTapestry()`  [INFERRED]
  app/embed/tapestries/[id]/page.tsx → lib/content.ts
- `generateMetadata()` --calls--> `getTapestry()`  [INFERRED]
  app/tapestries/[id]/page.tsx → lib/content.ts
- `TapestryPage()` --calls--> `getTapestry()`  [INFERRED]
  app/tapestries/[id]/page.tsx → lib/content.ts
- `Contribution Policy` --conceptually_related_to--> `Compact Canonical Scene Metadata`  [INFERRED]
  CONTRIBUTING.md → docs/superpowers/specs/2026-08-12-scene-metadata-v3-design.md
- `Append-Only Artwork Releases` --conceptually_related_to--> `R2 and Vercel Deployment`  [INFERRED]
  README.md → docs/deployment.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Canonical Content Release Flow** — readme_revelations_exhibition, docs_deployment_r2_vercel_deployment, readme_append_only_artwork_releases [INFERRED 0.85]
- **Reader Refinement System** — specs_2026_08_12_artwork_layout_design_non_distorting_artwork_layout, specs_2026_08_12_tapestry_reader_refinements_design_words_of_jesus_ranges, specs_2026_08_12_tapestry_reader_refinements_design_dependency_free_artwork_zoom [INFERRED 0.85]

## Communities (22 total, 4 thin omitted)

### Community 0 - "Content Generation"
Cohesion: 0.08
Nodes (34): annotateWordsOfJesus(), canonicalImageNodes(), displayReference(), mapCanvasToSceneIds(), parseAnnotatedUsfmRevelation(), parseRevelationAnchor(), parseUsfmRevelation(), parseVplRevelation() (+26 more)

### Community 1 - "Release Packaging"
Cohesion: 0.07
Nodes (22): contentDispositionFor(), contentTypeFor(), expectedReleaseFiles(), releasePaths(), validateReleaseInventory(), archiveStage, manifest, releaseRoot (+14 more)

### Community 2 - "Scripture and Artwork UI"
Cohesion: 0.09
Nodes (22): ArtworkImage(), ArtworkImageProps, SceneDialog(), zoomNames, VerseText(), assetUrl(), chapters, getScene() (+14 more)

### Community 3 - "Package Configuration"
Cohesion: 0.07
Nodes (27): dependencies, @aws-sdk/client-s3, next, react, react-dom, sharp, devDependencies, @playwright/test (+19 more)

### Community 4 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 5 - "Page Routes"
Cohesion: 0.22
Nodes (7): TapestryViewer(), EmbeddedTapestryPage(), generateMetadata(), TapestryPage(), allTapestries, archiveUrl, getTapestry()

### Community 6 - "Artwork Zoom"
Cohesion: 0.24
Nodes (8): boundedTransform(), clamp(), Drag, fittedArtwork(), Pinch, Point, Transform, ZoomableArtwork()

### Community 7 - "Site Chrome"
Cohesion: 0.38
Nodes (3): metadata, SiteFooter(), SiteHeader()

### Community 8 - "Local Development"
Cohesion: 0.38
Nodes (3): localDevCommands(), children, root

### Community 9 - "Reader Design"
Cohesion: 0.33
Nodes (7): Artwork Layout Implementation Plan, Tapestry Reader Refinements Plan, Artwork Layout Design, Non-Distorting Artwork Layout, Dependency-Free Artwork Zoom, Tapestry Reader Refinements Design, Words-of-Jesus Ranges

### Community 10 - "Static File Server"
Cohesion: 0.33
Nodes (5): port, portIndex, root, rootIndex, types

### Community 11 - "Scene Metadata"
Cohesion: 0.50
Nodes (4): Contribution Policy, Corrected Scene Metadata Plan, Compact Canonical Scene Metadata, Corrected Scene Metadata Design

### Community 12 - "Deployment and Licensing"
Cohesion: 0.50
Nodes (4): R2 and Vercel Deployment, Artwork License, Append-Only Artwork Releases, Revelations Exhibition

### Community 13 - "Movement Narratives"
Cohesion: 0.67
Nodes (3): Expanded Tapestry Movements Plan, Expanded Tapestry Movements Design, Structured Movement Narratives

## Knowledge Gaps
- **114 isolated node(s):** `metadata`, `ArtworkImageProps`, `zoomNames`, `Point`, `Transform` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Scene` connect `Scripture and Artwork UI` to `Artwork Zoom`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `getTapestry()` (e.g. with `EmbeddedTapestryPage()` and `generateMetadata()`) actually correct?**
  _`getTapestry()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `ArtworkImageProps`, `zoomNames` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Content Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.08414634146341464 - nodes in this community are weakly interconnected._
- **Should `Release Packaging` be split into smaller, more focused modules?**
  _Cohesion score 0.07394957983193277 - nodes in this community are weakly interconnected._
- **Should `Scripture and Artwork UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0855614973262032 - nodes in this community are weakly interconnected._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._