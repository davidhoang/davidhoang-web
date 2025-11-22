# Career Odyssey Data Format

This file explains how to maintain the career nodes in `career-odyssey.json`.

## ✨ Automatic Layout

**You don't need to specify coordinates!** The layout algorithm automatically positions nodes based on their connections. Just define the connections and the system handles the rest.

## Node Structure

Each node has the following properties:

- **id** (required): Unique identifier (lowercase, hyphenated)
- **label** (required): Display text for the node
- **type** (required): One of `milestone`, `company`, `event`, or `transition`
- **date** (optional): Date in `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` format for timeline positioning
- **pathTaken** (optional): Boolean indicating if this is part of your main career path (defaults to `true`)
- **connections** (optional): Array of node IDs that come **before** this node
- **description** (optional): Additional details shown when node is clicked
- **link** (optional): URL to learn more about this node
- **x, y** (optional): Manual position override if you need fine control

## Example Node

```json
{
  "id": "webflow",
  "label": "Webflow",
  "description": "VP of Design role",
  "type": "company",
  "date": "2016",
  "pathTaken": true,
  "connections": ["one-medical"]
}
```

**Date Formats:**
- `"2016"` - Year only (defaults to mid-year for positioning)
- `"2016-01"` - Year and month
- `"2016-01-15"` - Full date

## Adding a New Node

1. Add a new object to the `nodes` array
2. Give it a unique `id` (lowercase, hyphenated)
3. Add `connections` to link it to nodes that come before it
4. Set the `type` to match the category
5. **That's it!** The layout algorithm will position it automatically

## Connecting Nodes

The `connections` array lists nodes that come **before** this node chronologically. For example:

```json
{
  "id": "new-role",
  "label": "New Role",
  "type": "company",
  "connections": ["previous-company", "another-milestone"]
}
```

This means "previous-company" and "another-milestone" both lead to "new-role".

## Node Types

- **milestone**: Important life/career milestones (purple)
- **company**: Companies you worked at (blue)
- **event**: Personal events (yellow)
- **transition**: Life transitions or pivots (gray)

## Layout Algorithm

The system uses a **timeline-oriented layout**:
- **Horizontal axis = Time**: Nodes are positioned left-to-right based on their dates
- **Date clustering**: Nodes with similar dates are grouped together
- **Main path emphasis**: Nodes with `pathTaken: true` stay on the main horizontal line
- **Branch positioning**: Nodes with `pathTaken: false` branch above/below the main path
- **Connection-based fallback**: If no date is provided, nodes use connection-based positioning

### Visual Distinctions

- **Main path nodes** (`pathTaken: true`):
  - Thicker, solid borders
  - Connected with solid, colored lines
  - Stay centered on the timeline
  
- **Branch nodes** (`pathTaken: false`):
  - Dashed borders, slightly transparent
  - Connected with dashed, lighter lines
  - Positioned above/below the main path

## Manual Override (Optional)

If you need precise control, you can manually specify coordinates:

```json
{
  "id": "special-node",
  "label": "Special Node",
  "type": "milestone",
  "x": 500,
  "y": 300,
  "connections": ["other-node"]
}
```

## Tips

- **Just focus on connections** - the layout handles positioning
- Start with nodes that have no connections (root nodes)
- Build the graph by connecting nodes chronologically
- Descriptions help provide context when users click nodes
- Links can point to blog posts, company pages, or related content

