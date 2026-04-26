# hosting.hoverlay.com

This repository contains multiple independent web applications hosted together under the hoverlay.com domain. Each directory represents a separate, standalone web app with its own purpose and functionality.

## Repository Structure

Each subdirectory is a self-contained web application that can be deployed independently. The apps share no dependencies or code between them - they simply share a hosting repository for convenience.

## Individual Apps

- **51-steps-to-freedom** - Interactive steps application
- **a-lullaby-for-the-city** - Art/media project
- **artcourt** - Art-related web application
- **geniuses-of-kendall** - Location-specific project
- **hayti** - Community/location project
- **NationalPrayerBreakfast** - Event-related application
- **omuseum** - Museum/exhibition application
- **rise-above** - Motivational/inspirational project
- **SeeATree** - Tree visualization/mapping application
- **sign-the-promise** - Pledge/commitment application
- **teleprompter** - Teleprompter web application (see [teleprompter/CLAUDE.md](teleprompter/CLAUDE.md))
- **testing** - Test/experimental applications
- **tools** - Utility applications
- **utils** - Shared utilities (if any)

## Working with This Repository

When modifying or adding features:
1. Each app is completely independent
2. Changes to one app should not affect others
3. Each app may have its own CLAUDE.md with specific documentation
4. Test each app individually in its own directory

## Deployment

This repository is deployed to GitHub Pages and accessible via hosting.hoverlay.com. Each subdirectory is accessible as a path on the domain.
