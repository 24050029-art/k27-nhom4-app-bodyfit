# REST API Design Specifications - BodyFit AI

All API routes assume a base URL of `https://api.bodyfit-ai.com/v1` and require an Authorization Bearer header: `Authorization: Bearer <Firebase_ID_Token>`.

---

## 1. Authentication & Onboarding Endpoints

### `POST /auth/register`
Creates user profile from onboarding survey variables.
- **Request Body**:
  ```json
  {
    "firstName": "Alex",
    "dateOfBirth": "1995-04-12",
    "gender": "male",
    "heightCm": 178,
    "weightKg": 75.5,
    "activityLevel": "moderately_active",
    "targetGoal": "muscle_gain"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "data": {
      "userId": "9d9015c9-943c-41ab-85fa-71d5823862cd",
      "bmi": 23.83,
      "bmr": 1718.75,
      "tdee": 2664.06,
      "targets": {
        "calories": 2964,
        "protein": 185,
        "carbs": 333,
        "fat": 99,
        "waterMl": 3000
      }
    }
  }
  ```

---

## 2. Food & Hydration Logs

### `GET /logs/daily?date=2026-06-17`
Fetches all logged food entries and water intake for the target date.
- **Response (200 OK)**:
  ```json
  {
    "date": "2026-06-17",
    "totals": {
      "calories": 1450,
      "protein": 110,
      "carbs": 180,
      "fat": 42,
      "waterMl": 1250
    },
    "targets": {
      "calories": 2200,
      "protein": 150,
      "carbs": 250,
      "fat": 65,
      "waterMl": 2500
    },
    "foodLogs": [
      {
        "id": "e9b2512f-6893-4a11-b0db-ea728f3284ff",
        "mealType": "breakfast",
        "foodName": "Boiled eggs",
        "servingSizeG": 100,
        "calories": 155,
        "protein": 13,
        "carbs": 1.1,
        "fat": 11
      }
    ],
    "waterLogs": [
      {
        "id": "c613c230-67c2-4eb1-995a-b9c1fb22467d",
        "amountMl": 500,
        "loggedAt": "2026-06-17T08:30:00Z"
      }
    ]
  }
  ```

### `POST /logs/food`
Logs a manual food entry.
- **Request Body**:
  ```json
  {
    "mealType": "lunch",
    "foodName": "Chicken Breast",
    "servingSizeG": 150,
    "calories": 247,
    "protein": 46.5,
    "carbs": 0,
    "fat": 5.4,
    "loggedDate": "2026-06-17"
  }
  ```
- **Response (201 Created)**:
  ```json
  { "status": "success", "logId": "23c21a4f-561b-419b-a3d2-c2e3bf4a9238" }
  ```

---

## 3. AI Services

### `POST /ai/scan-food`
Uploads raw food images to recognize meals via OpenAI Vision.
- **Request (Multipart Form Data)**:
  - `file`: (Binary image data)
- **Response (200 OK)**:
  ```json
  {
    "mealDetected": "Com Tam Suon Nuong",
    "items": [
      { "name": "Broken white rice", "weightG": 200, "calories": 260 },
      { "name": "Grilled pork chop", "weightG": 120, "calories": 310 },
      { "name": "Fried egg", "weightG": 50, "calories": 90 }
    ],
    "estimatedWeightG": 370,
    "totalCalories": 660,
    "macros": {
      "protein": 38.5,
      "carbs": 62,
      "fat": 24.2
    }
  }
  ```

### `POST /ai/voice-log`
Transcribes and parses spoken phrases into food logs.
- **Request Body**:
  ```json
  {
    "transcript": "I just ate a beef pho bowl and drank an iced peach tea"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "parsedLogs": [
      {
        "foodName": "Beef Pho Bowl",
        "servingSizeG": 450,
        "calories": 550,
        "protein": 28,
        "carbs": 65,
        "fat": 12,
        "mealType": "lunch"
      },
      {
        "foodName": "Iced Peach Tea",
        "servingSizeG": 300,
        "calories": 120,
        "protein": 0,
        "carbs": 30,
        "fat": 0,
        "mealType": "snack"
      }
    ]
  }
  ```

---

## 4. AI Coach Chat API

### `POST /coach/chat`
Submits questions to the virtual nutrition coach.
- **Request Body**:
  ```json
  {
    "message": "Is it fine to eat chicken noodle soup before bed?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "reply": "Yes, Alex. A light chicken noodle soup is highly digestible and provides about 15g of protein, which supports muscle recovery overnight without burdening your stomach. Just try to consume it 2 hours before sleeping to avoid acid reflux.",
    "sentAt": "2026-06-17T13:10:00Z"
  }
  ```
