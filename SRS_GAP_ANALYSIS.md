# Chapters and Chats — SRS Traceability Matrix & Gap Analysis Report
**Specification Reference**: IEEE Std 830-1998 Platform Blueprint (v1.0.0)  
**Audit Scope**: Active React Frontend (`src/`) & Django Backend Apps (`backend/`)  
**Audit Date**: September 2026  

---

## Executive Summary

| Category | Count | Percentage |
| :--- | :---: | :---: |
| 🟢 **100% Live DB & API Integrated** | 0 | 0% |
| 🟡 **Hybrid / Mock Fallback Integrated** | 5 | 71.4% |
| 🔴 **Frontend Only / Mock Dependent** | 2 | 28.6% |
| **Overall SRS Implementation Coverage** | — | **~58% Production Ready** |

---

## 1. Traceability Matrix Summary Table

| Module ID & Name | Implementation Status | Current Live Backend Endpoints | Mock Data Dependency | Critical Missing Logic / Edge Cases | Recommended 1-Step Fix |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Module 1: 3-Week Cycle Engine** | 🟡 Hybrid/Mock Fallback | `GET /api/cycles/active/` | `mockCycleData.js` (milestones, announcements, recommendations) | • No admin UI to create new 21-day cycles.<br>• Milestone pages (33%, 66%, 100%) computed on frontend, not stored in DB. | Add Django model fields for cycle milestone ranges and an Executive cycle-creation endpoint. |
| **Module 2: Meeting Attendance Verification** | 🟡 Hybrid/Mock Fallback | `POST /api/meetings/check-in/`<br>`POST /api/meetings/generate-code/` | Optimistic fallback in `CheckInModal.jsx` if offline | • Time-window gating (12:30–15:30 on Tuesday) is **not validated** on backend `MeetingCheckInView`.<br>• Passcode stored in plain text rather than hashed (`passcode_hash`).<br>• No streak reset if a cycle is missed. | Add server-side `timezone.now()` validation within 12:30–15:30 window and enforce composite unique constraint in database migration. |
| **Module 3: Weekend Initiatives** (Six-Word Stories & Sunday Quiz) | 🟡 Hybrid/Mock Fallback | `GET/POST /api/activities/six-word-stories/`<br>`POST .../upvote/`<br>`GET/POST /api/activities/sunday-quiz/` | `mockWeekendData.js` (Hall of Fame, active prompt fallback) | • Backend serializer does **not validate** the exact 6-word rule on `content`.<br>• Saturday 00:01 open / Sunday 23:59 close scheduling is manual (`is_active`), not time-triggered.<br>• "Story of the Week" pinning to Home header is static. | Implement a regex/word-count validator (`len(content.strip().split()) == 6`) in `StorySubmissionSerializer`. |
| **Module 4: Book House Repository** | 🟡 Hybrid/Mock Fallback | `GET /api/books/` (with `?search=` and `?genre=`) | `mockBooksData.js` (fallback when API is unreachable) | • **No real PDF file download or streaming**: clicking download only shows a UI toast notice.<br>• NFR-1 HTTP 206 chunked stream and FR-4.2 authenticated session checks are missing. | Connect download buttons to `b.pdf_file.url` and add a protected Django streaming response endpoint with `IsAuthenticated`. |
| **Module 5: Discussions & Recommendation Hub** | 🔴 Frontend Only | `GET/POST /api/activities/discussions/` (Exists in Django but **not wired in React**) | `mockUserData.js` (`discussionThreads`, `communityPoll`) | • `Discussions.jsx` relies **100% on mock data** and local state.<br>• No backend models or endpoints for Community Book Polls or Book Suggestion pitches. | Create `PollOption`, `PollVote`, and `BookSuggestion` models in `activities`, and wire `Discussions.jsx` to API. |
| **Module 6: Gamification & Badges Engine** | 🟡 Hybrid/Mock Fallback | `GET/PATCH /api/users/me/progress/`<br>Badges awarded in `MeetingCheckInView` & `SundayQuizView` | `mockUserData.js` (profile badges list in `ProfileModal.jsx`) | • Only *Consistent Scholar* and *Quizmaster* badges are awarded on backend.<br>• *Micro-Author* (highest-voted story) and *Page Finisher* (100% page read before Tuesday) triggers are missing. | Add post-save signal or Celery task to evaluate and award *Micro-Author* and *Page Finisher* badges to `UserBadge`. |
| **Module 7: Identity, Leadership & Logistics** | 🔴 Frontend Only | None (Auth endpoints only: `/api/auth/*`, `/api/users/me/`) | `mockAboutData.js` (`leadershipTeam`, `meetingDetails`, `faqs`) | • Membership application form in `About.jsx` only sets a local React state boolean (`isSubmitted`), saving nothing to DB. | Create `MembershipApplication` model and `POST /api/accounts/apply/` endpoint. |

---

## 2. Pillar-by-Pillar Detailed Gap Identification

### 2.1 Module 1: 3-Week Reading Cycle Engine
* **SRS Clause**: FR-1.1, FR-1.2, FR-1.3
* **What is Live**:
  * `ActiveCycleView` (`/api/cycles/active/`) delivers active cycle information, target meeting date, and linked book metadata.
  * `Home.jsx` fetches `/cycles/active/` on mount and populates `HeroCurrentlyReading.jsx` and `CycleCountdown.jsx`.
  * Real-time countdown clock computes delta to upcoming Tuesday meeting (12:30 PM).
* **Gaps & Mock Dependencies**:
  * Milestone subdivision (Week 1: 1–33%, Week 2: 34–66%, Week 3: 67–100%) is calculated strictly in React UI components instead of backend-driven milestone models.
  * No executive frontend interface to schedule/create next cycle (FR-1.1).

### 2.2 Module 2: Meeting Attendance Verification System
* **SRS Clause**: FR-2.1, FR-2.2, FR-2.3, FR-2.4, TC-01, TC-02
* **What is Live**:
  * `POST /api/meetings/check-in/` validates passcode against `meeting.passcode`.
  * Duplicate submissions are checked against `AttendanceRecord.objects.filter(user=user, meeting=meeting)`.
  * Successful verification increments `user.current_streak` (+1) and `user.total_xp` (+50).
  * Auto-awards *Consistent Scholar* badge if `current_streak >= 4`.
* **Gaps & Edge Cases**:
  * **Critical Security Gap**: `MeetingCheckInView` does **not** check whether `timezone.now()` falls within the required window `12:30 - 15:30` on the scheduled Tuesday. Submissions outside the window currently succeed if the code matches.
  * SRS Section 6 specifies `passcode_hash VARCHAR(255)`, but backend stores raw unhashed passcodes.
  * Streak reset logic (`current_streak = 0` if absent in a completed cycle) is not implemented.

### 2.3 Module 3: Weekend Community Initiatives
* **SRS Clause**: FR-3.1, FR-3.2, TC-03, TC-05
* **What is Live**:
  * `GET/POST /api/activities/six-word-stories/` and `POST .../<pk>/upvote/` persist stories and toggle upvotes in SQLite.
  * `GET/POST /api/activities/sunday-quiz/` delivers 5 quiz questions, auto-grades submitted answers, awards 50 XP for 5/5, and awards *Quizmaster* badge.
* **Gaps & Edge Cases**:
  * **Server-side Validation Omission**: `SixWordStorySerializer` does not validate that `content` contains exactly 6 words. A user can submit arbitrary length strings directly to the API.
  * Automatic scheduling (open Saturday 00:01, close Sunday 23:59) is not enforced via cron or timestamps; relies on boolean flags.
  * Hall of Fame past winners are hardcoded in `mockWeekendData.js`.

### 2.4 Module 4: Book House (Digital Repository)
* **SRS Clause**: FR-4.1, FR-4.2, FR-4.3, TC-04, NFR-1
* **What is Live**:
  * `BookListView` (`/api/books/`) supports full-text search across `title`, `author`, `synopsis` and exact genre filtering.
  * Debounced search (300ms) and genre pill filters in `BookHouse.jsx` are fully connected to `/api/books/`.
* **Gaps & Edge Cases**:
  * **No Actual PDF Downloads**: The `Download PDF` and `Worksheet Guide` buttons in `BookCard.jsx` and `BookHouse.jsx` invoke `showToast()` with a simulation message rather than opening or streaming the actual uploaded file.
  * Missing authenticated binary stream endpoint with HTTP 206 chunked support (NFR-1, FR-4.2).

### 2.5 Module 5: Discussion & Recommendation Hub
* **SRS Clause**: FR-5.1, FR-5.2
* **What is Live**:
  * `DiscussionThread` model and `DiscussionThreadView` exist on backend.
* **Gaps & Mock Dependencies**:
  * **Frontend Disconnect**: `Discussions.jsx` does not consume `GET /api/activities/discussions/`. It renders static threads from `mockUserData.js`.
  * **Missing Models**: There are no database tables or serializers for:
    * Bi-monthly community book voting poll (title, options, vote tally).
    * Member book suggestion proposals (title, author, genre, pitch).
  * Upvoting threads, casting poll votes, and proposing book pitches are purely local React state updates.

### 2.6 Module 6: Gamification & Badges Engine
* **SRS Clause**: FR-4.6, Table 4.6
* **What is Live**:
  * `User.current_streak`, `total_xp`, and `current_page_read` exist in `accounts.User`.
  * `PATCH /api/users/me/progress/` updates and persists reading page progress slider.
  * *Consistent Scholar* (Gold) and *Quizmaster* (Bronze) badges are automatically awarded in backend views.
* **Gaps & Edge Cases**:
  * *Micro-Author* badge (Silver): Logic to award this to the author of the winning 6-word story at Sunday midnight does not exist.
  * *Page Finisher* badge (Silver): Logic to check whether `user.current_page_read >= book.total_pages` before Tuesday review does not exist.
  * `ProfileModal.jsx` displays hardcoded badges from `mockUserData.js` instead of mapping `user.user_badges`.

### 2.7 Module 7: Identity, Leadership & Logistics
* **SRS Clause**: Section 2.1, Section 3
* **What is Live**:
  * Meeting schedule, executive grid, and FAQ accordion are rendered cleanly adhering to brand color tokens (`#4D1414`, `#7F0404`, `#C46B02`, `#F4BB00`, `#FDDE54`).
* **Gaps & Mock Dependencies**:
  * Leadership team, venue details, and FAQs are loaded from `mockAboutData.js`.
  * Membership application form has no backend receiver: submissions vanish on page refresh.

---

## 3. Prioritized Action Plan to Reach 100% SRS Compliance

### Phase 1: Security & Attendance Window Gating (High Priority)
- [ ] **1.1 Time-Window Enforcement**: Update `backend/cycles/views.py` (`MeetingCheckInView`) to verify `timezone.now()` is on a Tuesday between `12:30` and `15:30` (return HTTP 403 otherwise, per TC-02).
- [ ] **1.2 Passcode Hashing**: Store passcodes hashed (`make_password` / `check_password`) to align with SRS Section 6.
- [ ] **1.3 Streak Reset Job**: Implement a management command or signal to set `current_streak = 0` for members who did not check in during the cycle meeting.

### Phase 2: Input Validation & Weekend Initiatives (High Priority)
- [ ] **2.1 Strict 6-Word Validation**: In `backend/activities/serializers.py`, add validator on `StorySubmissionSerializer`:
  ```python
  def validate_content(self, value):
      words = value.strip().split()
      if len(words) != 6:
          raise serializers.ValidationError("Story must be exactly 6 space-delimited words.")
      return value
  ```
- [ ] **2.2 Auto-Winner Determination**: Add logic/script to identify the highest-voted story on Sunday 23:59, flag it as `is_winner = True`, award the *Micro-Author* badge, and expose it via `/cycles/active/`.

### Phase 3: Book House Real PDF Streaming (Medium Priority)
- [ ] **3.1 Media URL Routing**: Ensure Django `MEDIA_URL` serves uploaded book files and guide worksheets.
- [ ] **3.2 Frontend Direct Download Link**: In `BookCard.jsx` and `BookHouse.jsx`, replace simulated toast handlers with direct download links (`window.open(book.pdfUrl)` or `<a href={book.pdfUrl} download>`).
- [ ] **3.3 Authenticated Stream Guard**: Add a dedicated download view checking `request.user.is_authenticated` before serving the PDF binary stream (FR-4.2, TC-04).

### Phase 4: Discussions & Community Poll Wiring (Medium Priority)
- [ ] **4.1 Create Poll & Suggestion Models**: In `backend/activities/models.py`, add `BookPoll`, `PollOption`, `PollVote`, and `BookSuggestion`.
- [ ] **4.2 Connect `Discussions.jsx`**: Replace mock imports in `Discussions.jsx` with calls to:
  * `GET/POST /api/activities/discussions/`
  * `GET/POST /api/activities/polls/active/`
  * `POST /api/activities/suggestions/`

### Phase 5: Gamification Badges & Application Form Persistence (Polish)
- [ ] **5.1 Dynamic Profile Badges**: Wire `ProfileModal.jsx` to render badges from `user.user_badges` fetched via `/api/users/me/`.
- [ ] **5.2 Auto-Award *Page Finisher***: In `UserProfileView.patch`, check if `current_page_read >= active_book.total_pages` and grant *Page Finisher* badge.
- [ ] **5.3 Membership Application API**: Add `MembershipApplication` model and hook up the form in `About.jsx`.
