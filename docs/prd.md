# Product Requirement Document (PRD) - BodyFit AI

## 1. Project Overview & Objectives
**BodyFit AI** is an advanced, AI-powered health and fitness mobile application designed to empower users to achieve their wellness goals (weight loss, muscle gain, weight maintenance, or general healthy lifestyle). By integrating cutting-edge computer vision (food photo scanning), LLM-based nutrition coaching, voice food logging, wearable synchronization, and a custom gamified progress system, BodyFit AI acts as a 24/7 personal dietitian and fitness coach.

### Target Objectives:
- Simplify food tracking using AI image recognition and voice input.
- Provide custom, goal-driven meal plans based on smart metabolic calculations (BMI, BMR, TDEE, Macros).
- Keep users engaged through automated push notifications, hydration tracking, gamification, and social challenges.
- Synchronize seamlessly with major fitness wearables (Apple Health, Google Fit, Garmin).

---

## 2. Functional Scope & Modules

### Module 1: Onboarding & Personalization
- **Auth Flow**: Register/Login via Email/Password, Google, Apple, and Facebook.
- **Biometric Collection**: Age, Gender, Height, Weight, Activity Level (Sedentary, Lightly Active, Moderately Active, Very Active, Athlete), and Body Goals.
- **Smart Analytics Engine**:
  - **BMI**: $\text{Weight (kg)} / \text{Height (m)}^2$
  - **BMR (Mifflin-St Jeor)**:
    - *Men*: $10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} + 5$
    - *Women*: $10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (y)} - 161$
  - **TDEE**: BMR $\times$ Activity Multiplier (1.2 to 1.9).
  - **Body Fat Estimation**: Computed via YMCA formula or U.S. Navy circumference method.
- **Macro Target Calculator**: Personalized targets for Protein (g), Carbs (g), and Fat (g) based on the chosen goal.

### Module 2: AI-Powered Food Journaling
- **Daily Journal**: Segmented by Breakfast, Lunch, Dinner, Snack.
- **Barcode Scanner**: Scan packaged goods to retrieve nutrition data from database.
- **AI Food Recognition**: Upload/capture a meal photo, and leverage OpenAI Vision to identify dishes, estimate weights (grams), and compute calories/macros (e.g. Cơm Tấm, Phở Bò).
- **Voice Food Logging**: Parse natural language phrases (e.g., "I just had a bowl of beef pho and an iced tea") into structured food entries using an LLM.
- **Search & Database**: Local and cloud libraries containing 100,000+ foods, featuring extensive Vietnamese, Asian, Western, and fast-food items.

### Module 3: Hydration (Water) Tracker
- **Intake Logging**: Quick-add buttons (250ml, 500ml, 1L) to record water intake.
- **Hydration Dashboard**: Interactive percentage rings with target goals (2L, 2.5L, 3L).
- **Smart Hydration Alerts**: Pre-scheduled reminders at 8:00, 10:00, 12:00, 14:00, 16:00, and 18:00.

### Module 4: AI Meal Planner
- **Dynamic Weekly Menu Generator**: Automatically designs 7/14/30-day schedules matching calorie/macro needs.
- **Diets Supported**: Eat Clean, Keto, Vegan, Vegetarian, Low Carb, High Protein, Mediterranean.
- **Preferences & Allergies**: Exclude ingredients (e.g., peanuts, seafood, gluten).

### Module 5: Recipe System & AI Recipe Generator
- **Recipe Guide**: View detailed cooking steps, ingredients, calorie/macro breakdowns, and videos.
- **AI Chef**: Input available ingredients (e.g., "chicken breast, eggs, spinach") and generate a custom, high-nutrition recipe instantly.

### Module 6: Smart Shopping List
- **Automated List**: Aggregate ingredients from the weekly meal plan into a structured shopping checklist.
- **Management**: Check off bought items, share list via messaging apps, and export as PDF.

### Module 7: Core Analytics & Progress Reports
- **Dynamic Dashboard**: Visual representations of daily calorie surplus/deficit and macronutrient ratios.
- **Progress Trackers**: Interactive charts showing Weight trends (7d, 30d, 90d, 1y) and Body Circumference measurements (Waist, Chest, Arms, Thighs).
- **AI Nutrient Diagnostics**: Weekly report analyzing diet quality (e.g., "Low on protein", "High saturated fats", "Deficient in vitamin D") with actionable steps.

### Module 8: Wearable & Health Integration
- **Integrations**: Apple HealthKit, Google Fit API, Garmin Connect API.
- **Sync Metrics**: Daily steps, active calories burned, average heart rate, sleep metrics.
- **Dynamic TDEE Adjustments**: Recalculate daily calorie limits dynamically when the user burns substantial active calories.

### Module 9: 24/7 AI Coach (Chatbot)
- **Conversational Interface**: Secure chat interface allowing users to ask dietary questions ("Can I eat pho at night?", "How do I maximize protein?").
- **Context-Aware Recommendations**: Answers are personalized based on the user's specific health goals, recent food logs, and biometric parameters.

### Module 10: Social Community & News Feed
- **Feed**: Share meal creations, weight loss achievements, and tips.
- **Social Interaction**: Like, comment, and share feeds.
- **Challenges**: Joined community challenges (e.g., "30-day hydration challenge", "10k steps daily challenge").

### Module 11: Gamification & Engagement
- **XP & Leveling System**: Earn experience points for logging food/water, finishing challenges, and reading recipe guides.
- **Badges & Achievements**: Unlock milestones (e.g., "7-Day Logging Streak", "Hydration Champion").

### Module 12: Smart Notification Engine
- **Push Notification Types**: Reminders for meal logging (Breakfast/Lunch/Dinner), hydration reminders, weekly weight-in alerts, and inactivity warnings.

---

## 3. Technical & Non-Functional Requirements

| Metric | Target |
|---|---|
| **Response Time** | API response under 200ms (95th percentile) for core database transactions. AI queries under 3s. |
| **Availability** | 99.9% uptime. |
| **Security** | End-to-end HTTPS. Firebase token validation. Encrypted health store data. |
| **Scale** | Horizontally scalable server nodes using Docker/Kubernetes; Redis caching layer for hot data. |
| **Localization** | Dual language support (Vietnamese, English). |
