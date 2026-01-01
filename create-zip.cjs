const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to write archive data to
const output = fs.createWriteStream('annotation-tool-complete.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('ZIP file created successfully!');
  console.log(archive.pointer() + ' total bytes');
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

// Good practice to catch this error explicitly
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files to the archive
const filesToInclude = [
  'index.html',
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/vite-env.d.ts',
  'src/components/Canvas.tsx',
  'src/components/StatusBar.tsx',
  'src/components/ToolButton.tsx',
  'src/components/FileManager.tsx',
  'src/components/ClassManager.tsx',
  'src/components/AnnotationList.tsx',
  'src/components/KeyboardShortcuts.tsx'
];

// Add each file to the archive
filesToInclude.forEach(file => {
  if (fs.existsSync(file)) {
    archive.file(file, { name: file });
  }
});

// Add README file
archive.append(`# Professional Annotation Tool

A comprehensive image annotation tool built with React, TypeScript, and Tailwind CSS.

## Features

- **Multiple Annotation Tools**: Rectangle, Circle, Polygon, Polyline, Text
- **Project Management**: Organize annotations into projects
- **Quick Tool**: Direct access to annotation tools
- **Dark/Light Mode**: Toggle between themes
- **Export/Import**: JSON format for annotations
- **Keyboard Shortcuts**: Efficient workflow
- **Responsive Design**: Works on all screen sizes

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Usage

### Dashboard
- View all projects and statistics
- Create new projects
- Access Quick Tool for immediate annotation

### Annotation Tool
- Upload images
- Use various annotation tools
- Manage classes and labels
- Export annotations as JSON

### Keyboard Shortcuts
- Press F1 to view all shortcuts
- R: Rectangle tool
- C: Circle tool
- P: Polygon tool
- S: Select tool
- G: Toggle grid
- Ctrl + Mouse Wheel: Zoom

## Project Structure

- \`src/App.tsx\` - Main application component
- \`src/components/\` - Reusable components
- \`src/index.css\` - Global styles with Tailwind

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (icons)

## License

MIT License
`, { name: 'README.md' });

// Finalize the archive
archive.finalize();