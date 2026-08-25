# Source Code Structure - BodyFit AI

This document maps out the file layout for both the Mobile Front-end (React Native / Expo) and the Backend API (NestJS).

---

## 1. Mobile Front-End Structure (`/mobile-app`)

The Expo project utilizes Expo Router. Below is the full target structure:

```text
mobile-app/
├── package.json               # Dependencies and build scripts
├── tsconfig.json              # TypeScript compilation rules
├── app.json                   # Expo configuration (App name, bundle ID, splash, icons)
├── assets/
│   └── images/
│       ├── tabIcons/          # PNG icons for Home, Journal, Coach, Analytics, Settings
│       └── logo.png           # Transparent branding logo
└── src/
    ├── app/
    │   ├── _layout.tsx        # App entry point, Theme Context, Splash animation controller
    │   ├── onboarding.tsx     # Onboarding user survey slides
    │   ├── profile-setup.tsx  # User info editing screen
    │   └── (tabs)/            # Tab navigation layout and routes
    │       ├── _layout.tsx    # Native tab trigger declarations
    │       ├── index.tsx      # Main Home Dashboard
    │       ├── journal.tsx    # Diary containing Food and Water Logs
    │       ├── coach.tsx      # AI coach chatbot window
    │       ├── analytics.tsx  # Analytics charts and progress trackers
    │       └── settings.tsx   # Developer and profile configs
    ├── components/
    │   ├── ui/
    │   │   ├── card.tsx       # Reusable card component
    │   │   ├── glass-card.tsx # Glassmorphic background blur card
    │   │   └── button.tsx     # Custom primary, secondary, outline buttons
    │   ├── dashboard/
    │   │   ├── calorie-ring.tsx  # Circular macro tracker
    │   │   └── steps-widget.tsx  # Step counter container
    │   ├── animated-icon.tsx  # Splash loading animations
    │   ├── themed-text.tsx    # Typographies that adapt to theme
    │   └── themed-view.tsx    # Layout surfaces that adapt to theme
    ├── constants/
    │   └── theme.ts           # Hex palettes, Spacing scales, Fonts variables
    ├── hooks/
    │   ├── use-theme.ts       # Utility returning active color palette (light/dark)
    │   └── use-local-db.ts    # React Context wrapping AsyncStorage for mock state
    └── services/
        ├── health-sync.ts     # HealthKit / HealthConnect sync wrapper
        └── ai-client.ts       # Simulated AI Vision and chat parsing layers
```

---

## 2. Backend API Structure (`/backend-api`)

Below is the structure of the NestJS application:

```text
backend-api/
├── package.json               # Backend script definitions & dependencies
├── tsconfig.json              # Backend TypeScript configs
├── nest-cli.json              # Nest CLI definitions
├── Dockerfile                 # Multi-stage Docker build config
├── docker-compose.yml         # Dev services orchestration (PG, Redis, Backend)
├── prisma/
│   └── schema.prisma          # Database schema migrations rules
└── src/
    ├── main.ts                # Application bootstraps (CORS, Rate limiters, Pipes)
    ├── app.module.ts          # Integrates all business modules
    ├── common/
    │   ├── decorators/        # Custom runtime helpers (e.g. CurrentUser)
    │   ├── guards/            # Auth, Role, API throttlers
    │   ├── interceptors/      # Cache caching handlers
    │   └── interfaces/        # Shared type mappings
    └── modules/
        ├── auth/
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   └── firebase.strategy.ts
        ├── user/
        │   ├── user.controller.ts
        │   └── user.service.ts
        ├── logs/
        │   ├── logs.controller.ts
        │   ├── logs.service.ts
        │   └── dto/
        │       ├── log-food.dto.ts
        │       └── log-water.dto.ts
        ├── ai/
        │   ├── ai.controller.ts
        │   ├── ai.service.ts
        │   └── prompts/       # Structured system prompts and schemas
        └── wearable/
            ├── wearable.controller.ts
            └── wearable.service.ts
```
