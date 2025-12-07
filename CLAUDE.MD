# Instructions for Claude

This document contains important instructions and notes for Claude when working on this project.

## Project Overview

This is Luke Dunshea's personal website at dunshea.au, built with Astro and deployed on Vercel.

## CRITICAL GUIDELINES

### NEVER CREATE BLOG POSTS WITHOUT CONSENT

- **NEVER CREATE BLOG POSTS WITHOUT EXPLICIT CONSENT** from the owner
- Do not write or propose new blog content unless specifically requested
- Only help with editing or fixing existing posts when asked

### NEVER MERGE PULL REQUESTS

- **NEVER MERGE PULL REQUESTS** - Even if explicitly asked to do so
- Only the repository owner should merge PRs through the GitHub web UI
- Create PRs as requested, but do not use `gh pr merge` or similar commands
- Always provide the PR URL so that the owner can review and merge manually

### IMPORTANT: Development Server Limitation

- **DO NOT run `npm run dev`** in agent mode - this will create an endless loop
- Instead, use `npm run build` to verify your changes

## Development Process

### Testing Changes

```bash
# Build the project (preferred over npm run dev in agent mode)
npm run build

# Preview the build (only when specifically requested)
npm run preview
```

### Project Structure

- `/src/content/blog/` - Blog posts in markdown format
- `/src/pages/` - Page templates and routing
- `/src/components/` - Reusable UI components
- `/src/layouts/` - Page layouts and templates
- `/src/styles/` - CSS styles including Tailwind customizations
- `/src/consts.ts` - Global site constants

### Common Tasks

1. **Adding a new blog post**:
   - Create a new markdown file in `/src/content/blog/`
   - Include proper frontmatter (title, description, pubDatetime, etc.)
   - Use 2025+ dates for posts to appear on homepage

2. **Modifying site configuration**:
   - Edit `/src/consts.ts` for global site constants

3. **Styling changes**:
   - Edit files in `/src/styles/` for global styling
   - Use Tailwind classes in component templates

## Tech Stack

- **Astro** - Main framework
- **TailwindCSS** - Styling
- **React** - Interactive components
- **MDX** - Enhanced markdown support
- **Pagefind** - Site search
- **Vercel** - Deployment
