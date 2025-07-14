# Product Requirements Document (PRD)

## 🧭 Product Overview

**Product Name:** Linda  
**Platform:** React Native app (Expo)  
**Tagline:** Connected, Globally.  
**Core Purpose:** Enable users to see where their friends live at the **city level** — and when they’re planning to move — in a **privacy-focused**, **global**, and **frictionless** way.

---

## 🌍 Product Philosophy

The world is more dynamic than ever. People move between cities and countries frequently, for work, study, or lifestyle. Yet, there's no easy, private way to keep track of where your friends live — especially if they move often or live globally distributed lives.

**Linda** solves this by letting you:
- Know **which city** your friends are in — and when they're moving.
- Maintain **privacy**: only friends can see your location, and data is encrypted on the server.
- Stay connected with low effort — **no check-ins, no messages**, just presence.

---

## ✅ Key Product Principles

- **City-level granularity only**: No street addresses or GPS precision.
- **Friend-only visibility**: Your data is only visible to friends you approve.
- **End-to-end encryption**: Location data is stored securely and privately.
- **Visual-first**: The map is the heart of the app.
- **Simple onboarding**: Name, city, phone number — that's it.

---

## 📱 Pages & Features

### 1. **Login Page**
- **Auth method:** Phone number only (via SMS verification).
- **Behavior:** 
  - If user exists → go to Map View.
  - If new user → go to Account Creation.

---

### 2. **Account Creation Page**
- **Inputs:**
  - Name
  - Current city (autocomplete input)
- **Flow:**
  - On submit → create account and set as "active" in selected city.
  - Redirect to Map View.

---

### 3. **Map View (Home Page)**
- **Core screen** of the app.
- Displays a **map with pins** at cities where friends live.

#### Features:
| Element                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| Map with city pins         | Each pin includes **friend’s profile picture** + **name** if a single user. |
| Multiple friends in city   | Pin displays a **number**, size scales with friend count.                  |
| Click on friend pin        | Opens **Friend Page**.                                                     |
| Click on city pin          | Opens **City Page** (overview of all friends in that city).                |
| Own city pin               | Special style (e.g., halo or color).                                       |
| Upcoming moves             | Line drawn from current to future city with **countdown timer**.           |
| Custom avatars             | Used in all map pins.                                                      |
| FAB (Floating Action Button)| Center-bottom button to add a move.                                        |

---

### 4. **Add Move Modal (Triggered from Map View)**
- **Trigger:** FAB at bottom center of Map View.
- **Form Fields:**
  - **Destination city** (autocomplete input)
  - **Start date** (required)
  - **End date** (optional: date or "Indefinite")
- **Behavior:** 
  - If start date is in the future → shown as **upcoming move**
  - On reaching start date, location updates automatically

---

### 5. **Profile Page**
- **Personal info:**
  - Name
  - Current city
  - Option to change current city
- **Move history:** List of past moves with dates.
- **Settings:** 
  - Manage account
  - Log out

---

### 6. **Add Friends Page**
- **Functionality:**
  - Add friends by phone number
  - See pending requests (incoming/outgoing)
- **States:**
  - Request sent
  - Request received
  - Accepted
- **Privacy:** Friendship must be mutual to share data.

---

### 7. **Friend Page**
- **Opened when clicking a friend’s pin on map.**
- **Content:**
  - Profile picture, name, current city
  - **Move & holiday history** (list of past and upcoming)
  - Optional note/message area (future feature)

---

### 8. **City Page**
- **Opened when clicking on a city pin (not just a friend).**
- **Content:**
  - City name
  - List of all friends currently in that city
  - Option to open each friend's Friend Page
  - Option to search/filter friends

---

## 🔐 Privacy & Security

- **Encryption:** Location data is encrypted server-side; decrypted only for friends.
- **No public sharing:** Data never exposed to non-friends.
- **Friendship required:** You can only see a friend's city after mutual acceptance.

---

## 📌 Clarifications & Design Decisions

### 1. **Move vs Visit**
- There is **no formal distinction** between a move and a visit.
- A **short trip** (e.g., 1–2 weeks) will naturally appear as a visit.
- An **indefinite move** is inputted with no end date.

### 2. **Map Interaction: Friends in the Same City**
- Pins grow in **size** with the number of friends in a city.
- Pin shows a **number** (e.g. "4") instead of names/avatars when >1 friend.
- Clicking the pin opens the **City Page**.

### 3. **Auth Provider**
- Still **undecided** for MVP.
- Likely candidates include **Firebase Auth** or a **custom SMS verification service**.

### 4. **Upcoming Move Expiry**
- If a user schedules a move, the app **automatically updates** their location on the start date.
- No user confirmation is needed.
- Users can cancel or edit future moves before they begin.

### 5. **Data Retention**
- **Target:** Move and location history will be retained **indefinitely**.
- This may be revised depending on data volume and user feedback.

---

## 🧪 Testing & QA Plan

- Unit tests with **Jest** + **React Native Testing Library**
- Coverage reporting enabled
- End-to-end flows to test:
  - Signup + location setting
  - Move creation + countdown
  - Friendship lifecycle (request → approval → visibility)
  - Map pin rendering logic
  - Privacy logic (e.g., unauthenticated access)

---

## 📦 Build Variants

Controlled by `APP_VARIANT`:
- `development`: `com.jhk.linda.dev`
- `preview`: `com.jhk.linda.preview`
- `production`: `com.jhk.linda`

---

## 🌐 Deployment & Tooling

- **Expo SDK 52**
- **Routing:** `expo-router`
- **Styling:** NativeWind (Tailwind for React Native)
- **Maps:** `expo-maps` (Google Maps)
- **Auth:** Phone number via third-party provider (TBD)
- **Error Tracking:** Sentry
- **Testing:** Jest + RN Testing Library
- **Build:** EAS Build with OTA support

---

## 🧭 Roadmap (Post-MVP ideas)

- Push notifications for new moves or visits
- Temporary “travel” vs “move” distinction
- Groups / tags (e.g., “college friends”)
- Desktop companion app

---