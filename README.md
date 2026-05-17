# EduSense

**EduSense** is a hackathon prototype of an **AI-powered student success assistant** embedded inside a simulated LMS dashboard. It combines a polished React dashboard, local mock school data, and a multi-agent assistant layer that can answer contextual questions about attendance, assignments, grades, schedules, announcements, and support interventions.

Built for reliable live demos, EduSense keeps the product experience realistic while avoiding fragile external school integrations. The result is a clean, judge-friendly prototype that shows how AI can help students understand what needs attention, why it matters, and what to do next.

---

## Table of Contents

- [Why This Project](#why-this-project)
- [Key Features](#key-features)
- [Workflow and Architecture](#workflow-and-architecture)
- [Assistant Agents](#assistant-agents)
- [Provider Modes](#provider-modes)
- [Validation Status](#validation-status)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Example Assistant Request](#example-assistant-request)
- [Running Locally](#running-locally)
- [Demo Notes](#demo-notes)

---

## Why This Project

Students often have the right data available somewhere in their LMS, but the data is fragmented across courses, announcements, calendars, gradebooks, and advisor notes.

**EduSense** explores how a student-facing AI assistant can turn that scattered context into clear, timely guidance:

- **What needs attention**
- **Why it matters**
- **What the student can do next**

The project is intentionally mock-data driven so it can be demonstrated reliably during judging without depending on a live school integration.

---

## Key Features

- **Contextual LMS dashboard:** Displays student profile details, course progress, assignments, announcements, schedule, attendance, and agent activity from local JSON data.
- **Floating AI assistant:** Provides an embedded chat experience inside the dashboard rather than a separate chatbot page.
- **Multi-agent routing:** Routes student questions by intent to specialized assistant agents for attendance, grades, deadlines, support, schedules, and announcements.
- **Ollama provider with fallback:** Attempts local Ollama generation first, then falls back to deterministic rule-based responses if the local model provider is unavailable.
- **Action-oriented replies:** Assistant responses include short next-step actions where applicable.
- **Persistent chat state:** The popup chat persists in browser `localStorage`.
- **Archive and clear chat controls:** Users can archive a conversation locally or clear the visible chat transcript.
- **Responsive composer:** The chat input expands dynamically for multi-line messages.
- **Mock API boundary:** The client talks to an Express API, keeping frontend rendering separate from assistant and data logic.

---

## Workflow and Architecture

```text
Student opens dashboard
  -> React + Vite client requests dashboard context
  -> Express API reads local JSON LMS data
  -> Dashboard renders student, course, assignment, schedule, and agent panels
  -> Student asks assistant a question
  -> Assistant route loads full mock LMS context
  -> Intent detector selects an agent
  -> Ollama model is called when available
  -> Rule-based assistant responds if Ollama is unavailable
  -> Reply and suggested actions return to the floating chat UI
```

### System Shape

EduSense separates the experience into three clear layers:

- **Client:** React dashboard and floating chat UI.
- **API:** Express routes for LMS data and assistant messages.
- **Assistant layer:** Intent detection, specialized agent routing, Ollama-backed generation, and deterministic fallback responses.

This keeps the prototype easy to demo, easy to reason about, and ready for future replacement of mock data with a real LMS integration.

---

## Assistant Agents

| Agent                    | Responsibility                                                               | Current Model Setting |
| ------------------------ | ---------------------------------------------------------------------------- | --------------------- |
| **Pulse Agent**          | Attendance, wellbeing, daily friction, and early warning signals              | `llama3.2:1b`         |
| **Sense-Maker Agent**    | Academic progress, grades, course patterns, and learning signals              | `deepseek-r1:7b`      |
| **Success Agent**        | Assignments, deadlines, interventions, and practical next actions             | `deepseek-r1:7b`      |
| **Admin-Strategy Agent** | Schedules, announcements, rubric updates, rooms, teachers, and logistics      | `deepseek-r1:7b`      |

> **Note:** The model names above are configured in `server/assistant/agents/*.js`. They are used only when a compatible local Ollama server is running.

---

## Provider Modes

| Mode                       | How It Works                                                                                                      | Status             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Ollama-backed assistant** | `AssistantEngine` calls `OllamaAssistantEngine`, which sends JSON-mode prompts to local Ollama through `OLLAMA_BASE_URL`. | Implemented        |
| **Rule-based fallback**    | If Ollama fails, `AssistantEngine` logs the failure and returns a deterministic response from `RuleBasedAssistantEngine`. | Implemented        |
| **Hosted LLM provider**    | A cloud provider integration is not currently wired in.                                                           | Planned / not live |

---

## Validation Status

| Area                         | Evidence                                                                                                      | Status         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- |
| **Production build**         | `npm.cmd run build` completes successfully with Vite.                                                         | Passing        |
| **Local client/server run path** | `npm.cmd run dev` starts the Express API and Vite client concurrently.                                     | Implemented    |
| **API data routes**          | Student, courses, assignments, announcements, grades, attendance, schedule, interventions, and agent themes are served from JSON files. | Implemented    |
| **Assistant endpoint**       | `POST /api/assistant/message` validates `studentId` and `message`, loads full context, and returns an assistant response. | Implemented    |
| **Automated tests**          | No test runner or automated test suite is currently configured in `package.json`.                             | Not configured |
| **Real LMS integration**     | Uses local mock JSON data only.                                                                               | Not live       |

---

## Tech Stack

| Layer                    | Technology                                           |
| ------------------------ | ---------------------------------------------------- |
| **Frontend**             | React 19, Vite 6                                     |
| **Styling**              | Tailwind CSS, custom theme tokens                    |
| **Icons**                | Lucide React                                         |
| **Backend**              | Node.js, Express                                     |
| **Local data**           | JSON files in `server/data`                          |
| **Assistant provider**   | Ollama local generation with rule-based fallback     |
| **Dev orchestration**    | `concurrently`                                       |

---

## Project Structure

```text
.
├── client/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── assistant/          # Floating EduSense chat UI
│       │   ├── dashboard/          # Dashboard panels and shared card styles
│       │   └── layout/             # Dashboard shell and navigation
│       └── services/api.js         # Browser API client
├── server/
│   ├── assistant/                  # Intent detection, agents, Ollama, fallback logic
│   ├── data/                       # Mock LMS JSON data
│   ├── routes/                     # Express API route modules
│   └── index.js                    # API server and static production host
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## API Endpoints

| Method | Endpoint                 | Purpose                           |
| ------ | ------------------------ | --------------------------------- |
| `GET`  | `/api/student`           | Student profile and summary data  |
| `GET`  | `/api/courses`           | Course list and progress data     |
| `GET`  | `/api/assignments`       | Assignment list and due dates     |
| `GET`  | `/api/announcements`     | LMS announcements                 |
| `GET`  | `/api/grades`            | Course grade data                 |
| `GET`  | `/api/attendance`        | Attendance summary                |
| `GET`  | `/api/schedule`          | Daily schedule                    |
| `GET`  | `/api/interventions`     | Mock support interventions        |
| `GET`  | `/api/agentThemes`       | Agent activity themes             |
| `POST` | `/api/assistant/message` | Assistant chat response           |

---

## Example Assistant Request

```json
{
  "studentId": "student_001",
  "message": "What assignments are due this week?"
}
```

### Expected Response Shape

The assistant endpoint returns a contextual response for the floating chat UI. When applicable, responses include:

- A concise answer.
- The selected agent or intent category.
- Suggested next actions.
- Fallback output if Ollama is unavailable.

---

## Running Locally

### Prerequisites

- **Node.js** installed locally.
- **npm** available from the terminal.
- Optional: **Ollama** running locally with compatible models installed.

### Install Dependencies

```bash
npm install
```

### Start the Development App

```bash
npm.cmd run dev
```

The development command starts both:

- The **Express API** for LMS data and assistant routes.
- The **Vite client** for the EduSense dashboard.

### Build for Production

```bash
npm.cmd run build
```

---

## Ollama Configuration

EduSense can call a local Ollama server when available. The assistant layer uses `OLLAMA_BASE_URL` to locate the provider.

Example local environment setting:

```bash
OLLAMA_BASE_URL=http://localhost:11434
```

If Ollama is unavailable, the app still works by returning deterministic rule-based assistant responses.

---

## Demo Notes

EduSense is designed for predictable hackathon judging:

- Uses **local mock JSON data** instead of live LMS credentials.
- Keeps AI responses functional even without a running model provider.
- Demonstrates realistic student workflows inside a polished dashboard.
- Shows a clear path from prototype to production integration.

---

## Current Limitations

- No automated test runner is currently configured.
- No hosted LLM provider is currently wired in.
- Real LMS integration is not live.
- All school data is loaded from local JSON files.

---

## Summary

**EduSense turns fragmented LMS context into practical student guidance.** It demonstrates how a dashboard-native AI assistant can help students understand academic risk, upcoming work, scheduling details, and support options without leaving the LMS experience.
