/**
 * Integration Guide: Implementation Instructions
 * Complete guide for integrating all new features into the app
 */

# GV.AI Annotation Tool - Feature Integration Guide

## Overview

This guide provides step-by-step instructions to integrate the following features:
1. **Project-Specific Taxonomy**
2. **Team Management Module**
3. **User Permissions System (RBAC)**
4. **Polygon Mask Support**
5. **Enhanced 3D Cuboid Operations**
6. **UI/UX Polish (Tooltips)**

---

## 1. Project-Specific Taxonomy Integration

### Step 1: Update Type Definitions
- Files: `src/types/taxonomy.ts` ✅ (Already created)
- Update `src/types/index.ts` to export taxonomy types

### Step 2: Integrate Taxonomy Store
- File: `src/store/taxonomyStore.ts` ✅ (Already created)
- Add to `src/App.tsx`:

\`\`\`typescript
import { useTaxonomyStore } from './store/taxonomyStore';

// In App component:
const { projectTaxonomies, getProjectClasses } = useTaxonomyStore();

// When switching projects:
useEffect(() => {
  if (currentProjectId) {
    const classes = getProjectClasses(currentProjectId);
    setAnnotationClasses(classes);
  }
}, [currentProjectId]);
\`\`\`

### Step 3: Create Project Taxonomy Panel Component
- File: `src/taxonomy/ProjectTaxonomyPanel.tsx` (To be created)
- Replace placeholder taxonomy component in `App.tsx`

### Step 4: Database/Backend Setup
- Create tables: `project_taxonomies`, `project_classes`, `project_attributes`, `global_attributes`
- Create API endpoints:
  - `POST/PUT /api/projects/{id}/taxonomy`
  - `GET /api/projects/{id}/taxonomy`
  - `GET/POST /api/global-attributes`

### Step 5: Backend Integration Points
Update `src/store/taxonomyStore.ts` uncommented sections:
\`\`\`typescript
// In persistTaxonomy:
await API.saveTaxonomy(projectId, taxonomy);

// In loadTaxonomy:
const taxonomy = await API.loadTaxonomy(projectId);
\`\`\`

---

## 2. Team Management Integration

### Step 1: Update Type Definitions
- Files: `src/types/team.ts` ✅ (Already created)
- Update `src/types/index.ts`

### Step 2: Integrate Team Store
- File: `src/store/teamStore.ts` ✅ (Already created)

### Step 3: Add Team Management to Navigation
In `src/App.tsx`:

\`\`\`typescript
// Add Team Management import
import TeamManagementPanel from './components/TeamManagementPanel';

// In viewMode routing:
{viewMode === 'team' && (
  <TeamManagementPanel
    projectId={currentProjectId}
    currentUserId={currentUserId}
    currentUserRole={userRole}
    dark={darkMode}
  />
)}
\`\`\`

### Step 4: Backend API Setup
Create endpoints:
- `GET/POST /api/users` - User management
- `GET /api/projects/{id}/members` - Project members
- `POST /api/projects/{id}/invite` - Send invitations
- `GET/POST /api/audit-logs` - Audit logging

### Step 5: Environment Configuration
Add to `.env`:
\`\`\`
VITE_API_BASE_URL=your_backend_url
VITE_ENABLE_TEAM_MANAGEMENT=true
\`\`\`

---

## 3. User Permissions System (RBAC) Integration

### Step 1: Initialize Permissions
- File: `src/store/permissionsStore.ts` ✅ (Already created)

### Step 2: In App Component Initialization
\`\`\`typescript
import { usePermissionsStore } from './store/permissionsStore';

useEffect(() => {
  const { initializeDefaultRoles } = usePermissionsStore.getState();
  initializeDefaultRoles();
}, []);
\`\`\`

### Step 3: Add Permission Guards to Components
\`\`\`typescript
import { PermissionGuard, PermissionChecker } from './utils/permissionChecker';

// Wrap components:
<PermissionGuard
  userId={currentUserId}
  userRole={userRole}
  action="edit"
  resource="annotations"
  projectId={currentProjectId}
  fallback={<p>You don't have permission to edit annotations</p>}
>
  <AnnotationEditor />
</PermissionGuard>
\`\`\`

### Step 4: Check Permissions Before Actions
\`\`\`typescript
const handleDeleteAnnotation = () => {
  if (!PermissionChecker.canPerform(
    currentUserId,
    userRole,
    'delete',
    'annotations',
    currentProjectId
  )) {
    alert('Permission denied');
    return;
  }
  // Proceed with deletion
};
\`\`\`

### Step 5: Backend Validation
Always validate permissions on backend:
\`\`\`typescript
// Example backend check (Node.js/Express)
app.delete('/api/annotations/:id', async (req, res) => {
  const userRole = req.user.role;
  const permission = await checkPermission(
    userRole,
    'delete',
    'annotations'
  );
  if (!permission.allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Proceed with deletion
});
\`\`\`

---

## 4. Polygon Mask Support Integration

### Step 1: Update Annotation Types
Update `src/types/index.ts` to include mask annotations

### Step 2: Create Polygon Mask Component
- File: `src/components/PolygonMaskEditor.tsx` (To be created)

### Step 3: Add Mask Mode Toggle to Canvas
In `src/components/Canvas.tsx`:

\`\`\`typescript
import { usePolygonMaskStore } from '../store/polygonMaskStore';

const { isMaskModeEnabled, toggleMaskMode, maskRenderOptions } = usePolygonMaskStore();

// Add toggle button to toolbar
<button onClick={toggleMaskMode} className={isMaskModeEnabled ? 'active' : ''}>
  Mask Mode
</button>
\`\`\`

### Step 4: Update Canvas Drawing
In `src/App.tsx` drawFunction:

\`\`\`typescript
// Import mask renderer
import MaskRenderer from './utils/maskRenderer';

// In drawing loop for polygon annotations:
if (ann.type === 'polygon' && isMaskModeEnabled) {
  MaskRenderer.renderMask(ctx, ann, maskRenderOptions, scale, offset);
} else {
  // Normal polygon rendering
}
\`\`\`

### Step 5: Export Mask Data
Create export handler:
\`\`\`typescript
const exportMaskAnnotations = (masks: PolygonMaskAnnotation[]) => {
  masks.forEach((mask) => {
    const imageData = MaskRenderer.createMaskImageData(
      mask,
      imageWidth,
      imageHeight
    );
    // Save as PNG/binary
  });
};
\`\`\`

---

## 5. Enhanced 3D Cuboid Operations Integration

### Step 1: Update 3D Workspace
- File: `src/annotation3d/Annotation3DWorkspace.tsx`

### Step 2: Add Cuboid Operations
\`\`\`typescript
import Cuboid3DUtils from '../utils/cuboid3dUtils';

// Handle cuboid transformations:
const handleCuboidRotation = (cuboid: Cuboid3D, axis: Vector3D, angle: number) => {
  const rotated = Cuboid3DUtils.rotateAroundAxis(cuboid, axis, angle);
  updateAnnotation(cuboid.id, rotated);
};

const handleCuboidScale = (cuboid: Cuboid3D, factors: { x?: number; y?: number; z?: number }) => {
  const scaled = Cuboid3DUtils.scale(cuboid, factors);
  updateAnnotation(cuboid.id, scaled);
};
\`\`\`

### Step 3: Render Cuboid Handles
\`\`\`typescript
// Get and render handles for manipulation
const vertices = Cuboid3DUtils.getVertices(selectedCuboid);
vertices.forEach((vertex, index) => {
  const projected = Cuboid3DUtils.project3DTo2D(vertex);
  // Draw handle at projected position
});
\`\`\`

### Step 4: Handle Mouse Interactions
Implement drag-to-transform logic for 3D cuboids

### Step 5: Backend Integration
Persist cuboid data with full transformation matrix

---

## 6. UI/UX Polish - Tooltips Integration

### Step 1: Create Tooltip Component
- File: `src/components/Tooltip.tsx` (To be created)

### Step 2: Create Info Icon Component
- File: `src/components/InfoIcon.tsx` (To be created)

### Step 3: Add Tooltips to Properties Panel
In `src/components/PropertiesPanel.tsx`:

\`\`\`typescript
import { InfoIcon } from './InfoIcon';
import { Tooltip } from './Tooltip';

<div className="flex items-center gap-2">
  <label>{propertyName}</label>
  <Tooltip content="Explanation of this property">
    <InfoIcon />
  </Tooltip>
</div>
\`\`\`

### Step 4: Add Tooltips to Toolbar
In `src/App.tsx` toolbar section:

\`\`\`typescript
{TOOLS_2D.map(tool => (
  <Tooltip key={tool.id} content={tool.description} placement="right">
    <button>{/* Tool button */}</button>
  </Tooltip>
))}
\`\`\`

### Step 5: Create Tooltip Registry
- File: `src/types/ui-tooltips.ts` ✅ (Already created)

---

## File Structure Summary

\`\`\`
src/
├── types/
│   ├── taxonomy.ts ✅
│   ├── team.ts ✅
│   ├── permissions.ts ✅
│   ├── polygon-mask.ts ✅
│   ├── cuboid-3d.ts ✅
│   └── ui-tooltips.ts ✅
├── store/
│   ├── taxonomyStore.ts ✅
│   ├── teamStore.ts ✅
│   ├── permissionsStore.ts ✅
│   └── polygonMaskStore.ts ✅
├── utils/
│   ├── permissionChecker.ts ✅
│   ├── maskRenderer.ts ✅
│   └── cuboid3dUtils.ts ✅
├── components/
│   ├── TeamManagementPanel.tsx ✅
│   ├── Tooltip.tsx (To create)
│   ├── InfoIcon.tsx (To create)
│   ├── PolygonMaskEditor.tsx (To create)
│   └── ProjectTaxonomyPanel.tsx (To create)
└── annotation3d/
    └── Annotation3DWorkspace.tsx (Update existing)
\`\`\`

---

## Backend API Endpoints Reference

### Taxonomy
- `GET /api/projects/{id}/taxonomy`
- `PUT /api/projects/{id}/taxonomy`
- `GET /api/global-attributes`
- `POST /api/global-attributes`

### Team Management
- `GET /api/projects/{id}/members`
- `POST /api/projects/{id}/members`
- `DELETE /api/projects/{id}/members/{userId}`
- `POST /api/invitations`
- `GET /api/audit-logs`

### Permissions
- `GET /api/roles`
- `POST /api/roles`
- `GET /api/roles/{id}/permissions`

---

## Testing Checklist

- [ ] Taxonomy per project working
- [ ] Global attributes visible across projects
- [ ] Team members can be added/removed
- [ ] Invitations sent and tracked
- [ ] Permissions enforced on UI
- [ ] Permissions validated on backend
- [ ] Polygon masks render correctly
- [ ] Mask opacity adjustable
- [ ] 3D cuboids rotatable
- [ ] 3D cuboids scalable
- [ ] Tooltips display on hover
- [ ] All components handle dark mode

---

## Database Schema Examples

### project_taxonomies
\`\`\`sql
CREATE TABLE project_taxonomies (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
\`\`\`

### project_classes
\`\`\`sql
CREATE TABLE project_classes (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  color VARCHAR(7),
  parent_id VARCHAR(255),
  sort_order INT,
  created_at TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
\`\`\`

---

## Next Steps

1. ✅ Type definitions complete
2. ✅ Store implementations complete
3. ✅ Utility functions complete
4. ⏳ Create remaining UI components
5. ⏳ Backend API implementation
6. ⏳ Integration testing
7. ⏳ Deploy to production

---

## Support & Documentation

For questions or issues during integration:
- Check existing component examples in `src/components/`
- Review store hooks in `src/store/`
- Refer to Zustand documentation: https://github.com/pmndrs/zustand
- Review React best practices

Good luck with the implementation! 🚀
