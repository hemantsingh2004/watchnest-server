# 🎬 WatchNest Backend

**WatchNest** is a web application designed to track and list your favorite entertainment media—movies, series, anime, etc.—and provide a platform for community-driven features.

This **backend repository**, built with **Express** and **TypeScript**, powers the application with secure routes for user management, list tracking, and external API integration (TMDB, Kitsu, OMDB).

---

## 📚 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Schema Overview](#schema-overview)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [What I Learned](#what-i-learned)
- [Project Reflection](#project-reflection)
- [Author](#author)

---

## 🚀 Features

### 🔐 Authentication and Authorization
- JWT-based authentication
- Access tokens stored in Redis
- Refresh tokens stored in MongoDB

### 👤 User Management
- Public & Private user profiles
- Search users by name or username
- Add/remove tags
- Friend system with shared lists

### 📝 List and Item Management
- **Lists**: Thematic, status-based, or custom
- **Items**: With custom notes, tags, ratings
- Advanced list operations like intersecting items across lists
- Collaborative & sharable lists

### 🌐 External API Integration
- **TMDB**, **Kitsu**, and **OMDB** support

### 🧪 Testing and Validation
- API testing with **Vitest**
- Input validation using **Joi**

---

## 🛠 Technologies Used

- **Node.js + Express**
- **TypeScript**
- **MongoDB + Mongoose**
- **Redis**
- **JWT**
- **Joi**
- **Vitest**
- **External APIs** (TMDB, Kitsu, OMDB)

---

## 📁 Project Structure

```plaintext
/watchnest-backend
├── src
│   ├── @types           # Custom TypeScript types
│   ├── helpers          # Utility functions
│   ├── middlewares      # Auth, error, and validation layers
│   ├── models           # Mongoose schemas (User, List, Item)
│   ├── routers          # Express route handlers
│   └── utils            # Shared utilities
├── tests                # Vitest unit tests
├── app.ts               # Main server entry
├── package.json         # Project metadata
└── README.md            # This file
````

---

## 📡 Routes

### 🔐 Authentication

* `POST /auth/register`
* `POST /auth/login`
* `POST /auth/refresh`

### 📂 Lists

* `GET /lists/:listId?type=statusBased|themeBased`
* `POST /lists`
* `PUT /lists/updatePrivacy/:listId`
* `DELETE /lists/:listId?type=statusBased|themeBased`

### 👥 Users

* `GET /users/search/:query?type=name|username`
* `DELETE /users/`
* `PUT /users/update?queryType=name|username|email|profileType`
* `PUT /users/updatePassword`
* `PUT /users/tag?queryType=add|remove`
* `GET /users/tags`

### 🎞 Items

* `GET /lists/:listId/items`
* `POST /lists/:listId/items`
* `PUT /lists/:listId/items/:itemId`
* `DELETE /lists/:listId/items/:itemId`

---

## 🧬 Schema Overview

### 👤 User Schema

Fields: `name`, `username`, `email`, `password`, `profileType`, `tags`, `friends`, `lists`, `sharedLists`, etc.

### 📂 List Schema

Fields: `name`, `type`, `privacy`, `items`, `sublists`, `updatedAt`, etc.

### 🎬 Item Schema

Fields: `mediaId`, `title`, `information`, `customNotes`, `tags`, `userRating`, `anticipation`, etc.

Includes complex media info like `rating`, `posterImage`, `genres`, and allows queries like:

> *“Find items present in both ‘Top Anime’ and ‘Top Hindi Movies’ lists”*

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hemantsinghdev/watchnest-server
cd watchnest-backend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file and configure:

* MongoDB URI
* Redis connection
* JWT secrets
* Port

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

---

## 🧪 Usage

Use Postman or Insomnia to test the REST API endpoints for:

* Registering/logging in users
* Creating and sharing lists
* Adding items to lists
* Searching for users
* Updating or deleting accounts

A full API reference will be added soon.

---

## 💡 What I Learned

This backend project helped me grasp many real-world skills:

* Designing large-scale backend apps in a modular way
* Working with complex **NoSQL schema design** (Mongoose)
* Handling multi-user systems with **role separation** and privacy
* Using **Redis** for token/session optimization
* Writing **REST APIs** that are structured and scalable
* Validating input with Joi and testing routes using Vitest
* Integrating **external APIs** and mapping them into my own data model

---

## 🧠 Project Reflection

This project was ambitious from the start.

I designed a full backend system — including authentication, list logic, social features, and API integrations — without first carefully finalizing the **database structure** and use-case flows.

That lack of planning caused significant confusion during the modeling phase. I rewrote many parts of the schema, and by the time I completed the backend, I was **mentally exhausted** from trying to fix its foundational issues.

As a result, I never finished building the frontend — and the project was **left incomplete**.

Still, this was one of my **most valuable learning experiences**, especially around:

* **Planning before building**
* How critical **schema clarity** is in backend projects
* The importance of pacing and maintaining motivation

---

## 👨‍💻 Author

Created as part of my full-stack development learning journey by
[**Hemant Singh**](https://github.com/hemantsinghdev)
