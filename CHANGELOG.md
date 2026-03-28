# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-03-20

### Fixed

- Resolved all Biome lint errors

### Changed

- Switched to npm OIDC trusted publishing (removed NPM_TOKEN)
- Added CI/CD workflows for lint, typecheck, build, and publish

## [0.1.0] - 2026-03-15

### Added

- Initial release of `@plexusui/cli` — copy-paste component installer
- 15+ GPU-accelerated React components:
  - **Charts**: Line, Area, Bar, Scatter, Histogram
  - **3D**: Point Cloud Viewer, 3D Model Viewer
  - **Instruments**: Attitude Indicator, Radar Chart
  - **Interactive**: Annotations, Ruler, Regions
  - **Data**: Gantt Chart, Data Grid with virtual scrolling
- WebGPU rendering with WebGL2 fallback
- Next.js 15 + React 19 playground with live demos
- Component registry with metadata (performance targets, maturity, complexity)
- `plexusui init` / `plexusui add` / `plexusui list` / `plexusui diff` commands

[0.1.1]: https://github.com/plexus-oss/ui/releases/tag/ui/v0.1.1
[0.1.0]: https://github.com/plexus-oss/ui/releases/tag/ui/v0.1.0
