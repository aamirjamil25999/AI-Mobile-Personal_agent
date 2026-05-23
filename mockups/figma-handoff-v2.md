# My Phone Agent - Figma Handoff v2 (8 Screens)

## Objective
Create an Android-first personal AI agent UI in Command Center style with strong security cues and automation visibility.

## Artboard and grid
- Device frame: 390 x 844
- Safe content area: 350 x 742
- Corner radius: phone shell 42, inner display 30
- Grid: 4 columns, 20 margin, 12 gutter
- Spacing scale: 8, 12, 14, 16, 20, 24, 32

## Color tokens
- bg.canvas: #0D1117
- bg.screen: #121C2E
- bg.surface: #16243C
- bg.surface.alt: #1A2741
- text.primary: #EAF2FF
- text.secondary: #9EB3CC
- text.muted: #8FA6C2
- accent.start: #00E5A8
- accent.end: #35A6FF
- state.warning: #FFBC42
- state.error.start: #FF6A6A
- state.error.end: #FF9A5C

## Typography
- Heading L: 25/31, 700
- Heading M: 19/25, 600
- Body: 13/19, 500
- Label: 14/20, 600
- CTA: 17/22, 700

## Components inventory
- App shell (device + display + notch)
- App bar (title + subtitle)
- Input prompt card
- Quick action tile
- Info card (automation, activity, settings)
- Toggle row
- Primary CTA button (accent gradient)
- Secondary CTA button (surface)
- Risk badge (warning)
- Error banner (danger gradient)
- Bottom nav strip

## Screen list (8)
1. Onboarding
- Intro hero with value proposition and Get Started CTA

2. Home
- Command box, quick actions grid, automations, recent activity, bottom nav

3. Command Execute
- User prompt bubble, plan steps, draft preview, approve CTA

4. Automation Builder
- Trigger, action block, schedule window, safety toggle, save/test actions

5. Activity
- Filter chips and timeline cards with status and metadata

6. Settings
- Security toggles, plugin health card, emergency controls

7. Approval
- Sensitive action details, risk indicator, biometric confirmation and approve/cancel

8. Error State
- Failure explanation, retry actions, settings fallback, debug details

## Motion notes
- Page transition: 200ms ease-out slide
- CTA press: 120ms scale to 0.98 then back
- Status updates: subtle fade 150ms

## Security UX rules
- High-risk actions always open approval screen
- Show reason and trace id for failed actions
- Never auto-execute risky settings changes without biometric confirmation

## Source files
- Visual board: /Users/aamirjamil/Desktop/my-phone-agent/mockups/my-phone-agent-v2-8screens.svg
- This handoff: /Users/aamirjamil/Desktop/my-phone-agent/mockups/figma-handoff-v2.md
