# Kibana-Class Enterprise UI/UX Specification

**Reference Target**: Elastic Kibana (Modern)
**Philosophy**: "Data Density with Cognitive Clarity"

## 1. Layout Architecture (The "Chrome")

### A. Global Navigation (Sidebar)
*   **Behavior**: Persistent, Collapsible (Icon-only mode).
*   **Structure**:
    *   **Top**: Brand / Workspace Switcher.
    *   **Middle**: Primary App Modules (Discover, Visualize, Dashboard, Canvas).
    *   **Bottom**: Management & settings.
*   **Visuals**: Dark Theme (`#1e1e24`), High contrast icons, labeled on hover in collapsed state.

### B. Application Shell (Top Bar)
*   **Purpose**: Context preservation & global actions.
*   **Elements**:
    *   **Breadcrumbs**: Hierarchy location (e.g., `Analytics / Sales Q3 / Overview`).
    *   **Global Search**: Omni-bar for jumping to saved objects.
    *   **Time Picker**: Global time range context (Crucial for Kibana-like apps).
*   **Visuals**: White/Light Gray background, distinct bottom border (`1px solid #d3dae6`).

### C. The Canvas (Page Content)
*   **Padding**: Tighter margins (`24px` outer, `16px` grid gaps).
*   **Background**: Neutral Gray (`#f5f7fa` in light mode, `#101c24` in dark).
*   **Grids**: strictly 12-column fluid grid.

## 2. Visual System

### A. Color Palette (Neutrality First)
*   **Primary Action**: `#0077cc` (Elastic Blue) - Used ONLY for primary buttons/links.
*   **Success**: `#00bfb3` (Tealish Green).
*   **Warning**: `#f5a700` (Amber).
*   **Danger**: `#bd271e` (Dark Red).
*   **Backgrounds**:
    *   `--euiColorEmptyShade` (White/Black)
    *   `--euiColorLightestShade` (Subtle backgrounds)
    *   `--euiColorLightShade` (Borders)

### B. Typography (Functional)
*   **Font**: Inter (closest open equivalent to Elastic UI font).
*   **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold) - No 300/500/800.
*   **Sizing**: Base 14px. Headers are small (Max 24px) to save vertical space.

## 3. Component Behavior

### A. Data Tables
*   **Density**: "Compact" mode by default. Row height ~32px.
*   **Interactions**:
    *   Hover row -> Reveal actions (Filter, Inspect).
    *   Shift-click -> Multi-select.
*   **Headers**: Sticky, sortable, resizable.

### B. Filter Bar
*   **Location**: Top of all data views (below Top Bar).
*   **Design**: Pill-shaped filters (`+ Add filter`).
*   **Logic**: Chips showing `Field: Value` with include/exclude toggles.

## 4. Feature Implementation: Single Page App (SPA) Structure
We migrate from "Pages" to "Workspaces":
1.  **Home**: Overview of health.
2.  **Discover**: Raw data exploration (Table + Histogram).
3.  **Visualize**: Aggregated charts (Feature 6 Mapping).
4.  **Dashboard**: Grid of visualizations.
5.  **Management**: Index patterns (File uploads).

## 5. Feature 6: Multi-File Correlation (The "Lens" Approach)
Instead of a separate page, Correlation is a **Visualization Type**:
*   User goes to "Visualize".
*   Selects "Data Source": Multiple Files.
*   Drag & Drop fields from File A and File B onto the workspace.
*   System auto-detects join keys (e.g., `id`).

This specification guides the code refactoring to match the Enterprise standard.
