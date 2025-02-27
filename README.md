# WatchNest Backend

WatchNest is a web application designed to track and list your favorite entertainment media—movies, series, anime, etc.—and provide a platform for community-driven features. This backend repository, built with Express and TypeScript, serves as the backbone of the application by providing secure, robust routes for user management, list management, and item tracking. It also integrates with external APIs (TMDB for movies/series and Kitsu for anime) to enrich your data.

---

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Routes](#routes)
- [Schema Overview](#schema-overview)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication & Authorization**
  - JWT-based authentication.
  - Access tokens stored in Redis for fast session validation.
  - Refresh tokens stored in MongoDB for persistent authentication.
- **User Management**

  - Supports both public and private users.
  - **Public Users:** Can be searched by name, followed by others, and can create private, public, or collaborative lists.
  - **Private Users:** Accessible only via user ID and upon approval; can create private, sharable, or collaborative lists.
  - Custom tags for users to organize their content.

- **List & Item Management**

  - **Lists:** Users can create various types of lists:
    - **Status-Based Lists:** E.g., "watchlist", "in-progress" (supporting anticipation ratings).
    - **Thematic/Custom Lists:** E.g., "favorite Hollywood movies", "best anime before 2000", with options for custom order and custom notes.
    - Lists include privacy settings and can be shared with or co-owned by multiple users.
  - **Items:** Each item within a list supports:
    - Custom notes.
    - Tags (e.g., "family-night-movie").
    - User ratings.
    - Anticipation ratings.
  - Supports complex queries such as intersecting items across multiple lists (e.g., movies that are both in "top anime" and "top Hindi movies").

- **External API Integration**

  - **TMDB:** For fetching movie and series data.
  - **Kitsu:** For fetching anime data.

- **Real-Time Collaboration**

  - Planned support for collaborative lists via WebSockets to enable live updates across users.

- **Testing & Validation**
  - Tests written with Vitest to ensure reliability.
  - Request validation implemented with Joi to maintain data integrity.

---

## Technologies Used

- **Node.js & Express:** Core server framework.
- **TypeScript:** For type-safe, production-ready code.
- **MongoDB & Mongoose:** Data persistence with robust schema definitions.
- **Redis:** In-memory storage for access tokens.
- **JWT:** Secure authentication mechanism.
- **Joi:** Data validation library.
- **Vitest:** Testing framework.
- **External APIs:** TMDB (movies/series) and Kitsu (anime).

---

## Project Structure

A modular structure helps maintain clear separation of concerns:

```plaintext
/watchnest-backend
  ├── src
      ├── config            # Environment and configuration files
      ├── controllers       # Route handlers
      ├── middlewares       # Authentication, validation, error handling
      ├── models            # Mongoose schemas (User, List, Item)
      ├── routes            # Express route definitions
      ├── services          # Business logic and external API calls (TMDB, Kitsu)
      └── utils             # Helper functions and utilities
  ├── tests                 # Vitest test cases for routes, controllers, etc.
  ├── .env.example          # Sample environment variables file
  ├── package.json          # Project dependencies and scripts
  └── README.md             # This file
```

---

## Routes

### Authentication

- **POST** `/auth/register`  
  Register a new user.

- **POST** `/auth/login`  
  Authenticate a user and issue JWT access/refresh tokens.

- **POST** `/auth/refresh`  
  Refresh expired tokens.

### User Routes

- **GET** `/users/:id`  
  Retrieve user details (private details require proper authorization).

- **GET** `/users/search`  
  Search for public users by name.

- **PUT** `/users/:id`  
  Update user profile and custom tags.

### List Routes

- **GET** `/lists`  
  Retrieve lists (filterable by type, privacy, etc.).

- **GET** `/lists/:id`  
  Retrieve a specific list including its items and sublists.

- **POST** `/lists`  
  Create a new list with properties like listType, listPrivacy, and shared user IDs.

- **PUT** `/lists/:id`  
  Update list details or collaborative list settings.

- **DELETE** `/lists/:id`  
  Delete an existing list.

### Item Routes (Within a List)

- **GET** `/lists/:listId/items`  
  Retrieve items from a specific list.

- **POST** `/lists/:listId/items`  
  Add a new item to a list (supports custom-notes, tags, user-rating, anticipation).

- **PUT** `/lists/:listId/items/:itemId`  
  Update an item's details.

- **DELETE** `/lists/:listId/items/:itemId`  
  Remove an item from the list.

---

## Schema Overview

### User Schema

- **Fields:**
  - `username`: String, required.
  - `email`: String, required.
  - `password`: String, hashed.
  - `userType`: Enum ('public' | 'private').
  - `customTags`: Array of strings.
  - Additional fields as needed for approval and profile data.

### List Schema

- **Fields:**
  - `name`: String, required.
  - `listType`: Enum ('status-based', 'thematic', 'custom').
  - `listPrivacy`: Enum ('private', 'public', 'collaborative', 'sharable').
  - `sharedWith`: Array of User IDs (for collaborative lists).
  - `sublists`: Optional nested list of lists.
  - `items`: Array of Item subdocuments or references.

### Item Schema

- **Fields:**
  - `mediaId`: Unique identifier for the media (from TMDB/Kitsu).
  - `customNotes`: String, optional.
  - `tags`: Array of strings (e.g., custom tags like "family-night-movie").
  - `userRating`: Number, optional.
  - `anticipation`: Number, optional.
  - Other metadata as needed for integration with external APIs.

_Note: With properly designed schemas (e.g., storing common media references and then attaching list-specific details), you can query for intersections—like movies that exist in both "top anime" and "top Hindi movies"—by querying the shared media IDs across lists._

---

## Installation & Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/watchnest-backend.git
   cd watchnest-backend

   ```

2. **Install Dependencies**
   ```bash
   npm install
   or
   yarn install
   ```
   
4. **Configure Environment Variables**
   Create a `.env` file and define environment variables based on your configuration.

5. **Start the Server**
   ```bash
   npm run dev
   or
   yarn dev
   ```

---

## Usage

Use the provided endpoints to manage users, lists, and items.
For testing the endpoints, consider using tools like Postman or Insomnia.
Detailed API documentation is provided (or will be provided) to guide you through request/response formats and authentication flows.

---

## Contributing

Contributions are welcome! Please follow these steps:

Fork the repository.
Create a new feature branch (git checkout -b feature/YourFeature).
Commit your changes (git commit -m 'Add some feature').
Push to the branch (git push origin feature/YourFeature).
Open a pull request.
Ensure your code adheres to our style guidelines and that all tests pass before submitting a pull request.

---

## License

This project is licensed under the MIT License.

---

## Happy coding and thank you for contributing to WatchNest!
