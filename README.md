# StoryTime Waitlist API ✨

## Overview
This project is a robust backend service designed to manage a waitlist for the StoryTime platform. Built with **NestJS** and **TypeScript**, it leverages **Prisma ORM** for efficient PostgreSQL database interactions and integrates **Nodemailer** with **React-Email** for dynamic email notifications. The API provides endpoints for users to subscribe to the waitlist and for administrators to manage subscriber data.

## Features
*   🚀 **Waitlist Subscription**: Allows users to securely join the StoryTime waitlist.
*   📧 **Automated Welcome Emails**: Sends personalized welcome emails to new subscribers using React-Email templates and Nodemailer.
*   💾 **Persistent Data Storage**: Manages waitlist user data using PostgreSQL and Prisma ORM.
*   🛡️ **Data Validation**: Ensures data integrity with comprehensive request payload validation using `class-validator` and `class-transformer`.
*   📊 **Paginated Admin Access**: Provides paginated access to waitlist entries for administrative purposes.
*   ⚙️ **Global Error Handling**: Implements a centralized exception filter for consistent and informative error responses.
*   ✅ **Standardized API Responses**: Utilizes a global interceptor to format all successful API responses uniformly.
*   📄 **Interactive API Documentation**: Automatically generates and serves API documentation using Swagger.

## Technologies Used
| Technology | Description |
| :--------- | :---------- |
| **[NestJS](https://nestjs.com/)** | A progressive Node.js framework for building efficient, reliable, and scalable server-side applications. |
| **[TypeScript](https://www.typescriptlang.org/)** | A strongly typed superset of JavaScript that compiles to plain JavaScript, enhancing code quality and developer productivity. |
| **[Prisma ORM](https://www.prisma.io/)** | A next-generation ORM for Node.js and TypeScript, offering type-safe database access and migrations. |
| **[PostgreSQL](https://www.postgresql.org/)** | A powerful, open-source object-relational database system known for its reliability, feature robustness, and performance. |
| **[Nodemailer](https://nodemailer.com/)** | A module for Node.js applications to allow easy email sending. |
| **[React-Email](https://react.email/)** | A framework for building and sending beautiful emails with React and Tailwind CSS. |
| **[Swagger (OpenAPI)](https://swagger.io/)** | A set of open-source tools built around the OpenAPI Specification for designing, building, and documenting RESTful APIs. |
| **[Docker](https://www.docker.com/)** | A platform for developing, shipping, and running applications in containers (implicitly used for local database setup). |

## Getting Started

### Installation
To get this project up and running locally, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Bolt-Silverfox/storytime-waitlist-be.git
    cd storytime-waitlist-be
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file in the root of the project based on the `.env.example` (or the list below) and fill in the required values.

4.  **Generate Prisma Client & Run Migrations**:
    ```bash
    npm run db:generate
    npm run db:migrate
    ```
    Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL`.

### Environment Variables
All required environment variables are listed below with examples:

```dotenv
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/storytime_waitlist_db?schema=public"

# Application Configuration
PORT=3000
FRONTEND_URL="http://localhost:3000" # URL of the frontend client for CORS
NODE_ENV="production"

# Email Service Configuration
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587 # Common ports: 465 (SSL), 587 (TLS)
MAIL_USERNAME="your-email@example.com"
MAIL_PASSWORD="your-email-app-password" # Use an app password if using services like Gmail
MAIL_FROM_ADDRESS="noreply@storytime.com"
MAIL_FROM_NAME="StoryTime"
MAIL_ENCRYPTION="TLS" # Options: TLS, SSL, NONE
```

## Usage

After completing the installation and setting up environment variables, you can run the application:

1.  **Start the Development Server**:
    ```bash
    npm run start:dev
    ```
    The application will run in watch mode, automatically reloading on code changes.

2.  **Access the API**:
    The API will be available at `http://localhost:3000/api/v1` (or your configured `PORT`).

3.  **Access Swagger API Documentation**:
    While the development server is running, you can view the interactive API documentation at `http://localhost:3000/docs`. This interface allows you to explore endpoints, understand request/response schemas, and even test the API directly from your browser.

## API Documentation

### Base URL
The base URL for all API endpoints is `/api/v1`.

### Endpoints

#### POST /waitlist/subscribe
Subscribes a new user to the StoryTime waitlist and sends a welcome email.

**Request**:
```json
{
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```
**Response**:
```json
{
  "status": "success",
  "data": {
    "email": "john.doe@example.com",
    "name": "John Doe"
  },
  "message": "Operation completed successfully",
  "error": null
}
```
**Errors**:
-   `400 Bad Request`: Invalid input provided (e.g., missing fields, invalid email format).
-   `409 Conflict`: Email address is already registered in the waitlist.
-   `500 Internal Server Error`: An unexpected server error occurred.

#### GET /waitlist/emails
Retrieves a list of all users subscribed to the waitlist. (Admin access typically required).

**Request**:
No request body.

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "clxb6x02h0000j5b8b9j0l0i5",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "created_at": "2023-10-26T10:00:00.000Z",
      "updated_at": "2023-10-26T10:00:00.000Z"
    },
    {
      "id": "clxb6x02h0001j5b8b9j0l0i6",
      "email": "jane.smith@example.com",
      "name": "Jane Smith",
      "created_at": "2023-10-25T09:30:00.000Z",
      "updated_at": "2023-10-25T09:30:00.000Z"
    }
  ],
  "message": "Operation completed successfully",
  "error": null
}
```
**Errors**:
-   `500 Internal Server Error`: An unexpected server error occurred.

#### GET /waitlist/emails/paginated
Retrieves a paginated list of waitlist users, useful for administrative interfaces.

**Request**:
Query Parameters:
-   `page`: (Optional) The page number to retrieve. Defaults to `1`.
-   `limit`: (Optional) The maximum number of items per page. Defaults to `10`.

Example: `/api/v1/waitlist/emails/paginated?page=2&limit=5`

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "clxb6x02h0002j5b8b9j0l0i7",
      "email": "user3@example.com",
      "name": "User Three",
      "created_at": "2023-10-24T11:45:00.000Z",
      "updated_at": "2023-10-24T11:45:00.000Z"
    },
    {
      "id": "clxb6x02h0003j5b8b9j0l0i8",
      "email": "user4@example.com",
      "name": "User Four",
      "created_at": "2023-10-23T14:00:00.000Z",
      "updated_at": "2023-10-23T14:00:00.000Z"
    }
  ],
  "message": "Operation completed successfully",
  "error": null,
  "pagination": {
    "page": 2,
    "limit": 2,
    "total": 5,
    "total_pages": 3,
    "has_next": true,
    "has_previous": true
  }
}
```
**Errors**:
-   `500 Internal Server Error`: An unexpected server error occurred.

## License
This project is currently unlicensed. Please refer to the `package.json` for details.

## Author Info
Developed by a passionate software engineer.
*   **LinkedIn**: [Your LinkedIn Profile]
*   **Twitter**: [Your Twitter Handle]
*   **Portfolio**: [Your Personal Website/Portfolio]

---

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-1A1A1A?style=for-the-badge&logo=nodemailer&logoColor=white)](https://nodemailer.com/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![GitHub Actions CI](https://img.shields.io/badge/CI/CD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Bolt-Silverfox/storytime-waitlist-be/actions)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)