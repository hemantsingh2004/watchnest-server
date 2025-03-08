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
  - **Private Users:** Accessible only via username and upon approval; can create private, sharable, or collaborative lists.
  - Custom tags for users to organize their content.
  - **Searching other users:** Can be searched by name, followed by others, and can create private, public, or collaborative lists.
  - **Friends:** Users can be friends and share lists together.

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
  - **List Sharing:** Lists can be shared with other users, making them accessible to them.
  - **Collaborative Lists:** Lists can be made collaborative, allowing multiple users to work on them together.

- **External API Integration**

  - **TMDB:** For fetching movie and series data.
  - **Kitsu:** For fetching anime data.
  - **OMDB:** For fetching through IMDB Id.

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
      ├── @types            # Custom typescript definitions
      ├── helpers           # Helper functions
      ├── middlewares       # Authentication, validation, etc.
      ├── models            # Mongoose schemas (User, List, Item)
      ├── routers           # Express route definitions
      └── utils             # Helper functions and utilities
  ├── tests                 # Vitest test cases for routes, controllers, etc.
  ├── app.ts                # Main entry point
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

### List Basic Routes

- **GET** `/lists/:listId?type=statusBased|themeBased`  
  Retrieve a specific list including its items and sublists.

- **POST** `/lists`  
  Create a new list with properties like listType, listPrivacy, and shared user IDs.

- **PUT** `/lists/updatePrivacy/:listId`  
  Update list details or collaborative list settings.

- **DELETE** `/lists/:listId?type=statusBased|themeBased`  
  Delete an existing list.

### User Basic Routes

- **GET** `/users/search/:query?type=name|username`
  Search for users, if type is name, then all the users whose profile is public will be returned.
  if type is username, then all the users whose profile is public or private will be returned.

- **DELETE** `/users/`  
  Delete a user's account.

- **PUT** `/users/update?queryType=name|username|email|profileType`  
  Update user profile details like name, username, email or profileType.

- **PUT** `/users/updatePassword`  
  Update user's password.

- **PUT** `/users/tag?queryType=add|remove`  
  Add or remove tag to a user's profile.

- **GET** `/users/tags`  
  Get all tags of a user.

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
  - `name`: String, required.
  - `username`: String, required.
  - `email`: String, required.
  - `password`: String, hashed.
  - `profileType`: Enum ('public' | 'private').
  - `refreshToken`: String, optional.
  - `tags`: Array of strings.
  - `list`: Array of List IDs.
  - `friendRequests`: Array of User IDs.
  - `friends`: Array of User IDs.
  - `sharedLists`: Array of SharedList IDs.
  - `collaborativeLists`: Array of CollaborativeList IDs.
  - Additional fields as needed for approval and profile data.

### List Schema

- **Fields:**
  - `name`: String, required.
  - `Type`: Enum ('status-based', 'thematic', 'custom').
  - `Privacy`: Enum ('private', 'public', 'collaborative', 'sharable').
  - `items`: Array of Item subdocuments or references.
  - `sublists`: Array of List IDs.
  - `addedAt`: Date.
  - `updatedAt`: Date.

### Item Schema

- **Fields:**
  - `mediaId`: Unique identifier for the media (from OMDB/Kitsu).
  - `Title`: String, required.
  - `information`: Object containing information about the media.
    - `information.createdAt`: Date, required.
    - `information.updatedAt`: Date, optional.
    - `information.rating`: Number, optional.
    - `information.ageRating`: String, optional.
    - `information.posterImage`: String, required.
    - `information.coverImage`: String, optional.
    - `information.genres`: Array of strings, optional.
  - `customNotes`: String, optional.
  - `tags`: Array of strings (e.g., custom tags like "family-night-movie").
  - `userRating`: Number, optional.
  - `anticipation`: Number, optional.
  - `sortOrder`: Number, optional.
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
3. **Configure Environment Variables**
   Create a `.env` file and define environment variables based on your configuration.

4. **Start the Server**
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
