# StoryTime Waitlist API ✨

## Overview
This project is a robust backend API developed with TypeScript, NestJS, and Prisma, designed to manage user waitlist subscriptions for the StoryTime platform. It provides endpoints for users to join a waitlist and for administrators to retrieve subscriber information, integrated with email notification services.

## Features
-   **Waitlist Management**: Enables users to subscribe to the StoryTime waitlist and provides functionality to retrieve all registered waitlist emails.
-   **Email Notifications**: Automatically dispatches personalized welcome emails to new subscribers using Nodemailer and Handlebars templating.
-   **Data Persistence**: Manages waitlist user data efficiently using Prisma ORM with a PostgreSQL database.
-   **API Documentation**: Offers comprehensive and interactive API documentation powered by Swagger, facilitating easy exploration and testing of endpoints.
-   **Strong Typing & Validation**: Implements TypeScript for type safety and `class-validator` with NestJS's `ValidationPipe` for robust input validation.

## Technologies Used

| Technology         | Description                                        | Link                                             |
| :----------------- | :------------------------------------------------- | :----------------------------------------------- |
| **NestJS**         | Progressive Node.js framework for building efficient, reliable, and scalable server-side applications. | [NestJS](https://nestjs.com/)                    |
| **TypeScript**     | Strongly typed superset of JavaScript that compiles to plain JavaScript. | [TypeScript](https://www.typescriptlang.org/)    |
| **Prisma**         | Next-generation ORM for Node.js and TypeScript, used for database access. | [Prisma](https://www.prisma.io/)                 |
| **Node.js**        | JavaScript runtime built on Chrome's V8 JavaScript engine. | [Node.js](https://nodejs.org/)                   |
| **PostgreSQL**     | Powerful, open-source object-relational database system. | [PostgreSQL](https://www.postgresql.org/)        |
| **Nodemailer**     | Module for Node.js applications to allow easy email sending. | [Nodemailer](https://nodemailer.com/)            |
| **Handlebars**     | Templating engine to create dynamic HTML for emails. | [Handlebars](https://handlebarsjs.com/)          |
| **Swagger (OpenAPI)** | Tooling to generate interactive API documentation.  | [Swagger](https://swagger.io/docs/specification/about-api-specification/) |
| **ESLint**         | Pluggable and configurable linter tool for identifying and reporting on patterns in JavaScript. | [ESLint](https://eslint.org/)                    |
| **Prettier**       | Opinionated code formatter.                        | [Prettier](https://prettier.io/)                 |

## Getting Started
To get this project up and running on your local machine, follow these steps.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Bolt-Silverfox/storytime-waitlist-be.git
    cd storytime-waitlist-be
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Database**:
    Ensure you have a PostgreSQL database running and accessible. Prisma will connect to it using the `DATABASE_URL` environment variable.

4.  **Run Prisma Migrations**:
    Apply the Prisma schema to your database.
    ```bash
    npx prisma migrate deploy
    ```

5.  **Build the Project**:
    ```bash
    npm run build
    ```

6.  **Start the Application**:
    To start in development mode with hot-reloading:
    ```bash
    npm run start:dev
    ```
    For production mode:
    ```bash
    npm run start:prod
    ```
    The application will typically run on `http://localhost:3000`.

### Environment Variables
The application requires the following environment variables to be set. Create a `.env` file in the project root and populate it as follows:

```
DATABASE_URL="postgresql://user:password@localhost:5432/storytime_waitlist?schema=public"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-app-password"
EMAIL_FROM="noreply@storytime.com"
```

**Explanation:**
-   `DATABASE_URL`: Connection string for your PostgreSQL database.
-   `EMAIL_HOST`: SMTP host for sending emails (e.g., `smtp.gmail.com` for Gmail).
-   `EMAIL_PORT`: SMTP port (e.g., `587` for TLS).
-   `EMAIL_USER`: Email account username for SMTP authentication.
-   `EMAIL_PASS`: Email account password or application-specific password for SMTP authentication.
-   `EMAIL_FROM`: The 'From' email address for outgoing emails.

## API Documentation
The API documentation is available via Swagger UI.

### Base URL
`http://localhost:3000/api/v1`

The full interactive documentation can be accessed at:
`http://localhost:3000/docs`

### Endpoints

#### POST /waitlist/subscribe
Subscribes a new user to the StoryTime waitlist.
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
  "message": "Successfully added to waitlist",
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```
**Errors**:
-   `400 Bad Request`: If request payload is invalid (e.g., missing fields, invalid email format).
-   `409 Conflict`: If the email address is already registered in the waitlist.

#### GET /waitlist/emails
Retrieves a list of all users currently on the waitlist. This endpoint is typically for administrative use.
**Request**:
(No request body required)
**Response**:
```json
[
  {
    "id": "clxb9s26g0000r39q4936p53r",
    "email": "user1@example.com",
    "name": "Alice Smith",
    "createdAt": "2024-07-30T10:00:00.000Z",
    "updatedAt": "2024-07-30T10:00:00.000Z"
  },
  {
    "id": "clxb9s26g0001r39q4936p53s",
    "email": "user2@example.com",
    "name": "Bob Johnson",
    "createdAt": "2024-07-29T15:30:00.000Z",
    "updatedAt": "2024-07-29T15:30:00.000Z"
  }
]
```
**Errors**:
(No specific error responses defined beyond standard HTTP errors for server issues)

## Usage

Once the application is running, you can interact with the API using tools like `curl`, Postman, or through the Swagger UI.

### Subscribing to the Waitlist

To add a new user to the waitlist, send a POST request to the `/api/v1/waitlist/subscribe` endpoint.

**Example using `curl`:**
```bash
curl -X POST \
  http://localhost:3000/api/v1/waitlist/subscribe \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "new.user@example.com",
    "name": "New User"
  }'
```

**Expected Successful Response:**
```json
{
  "message": "Successfully added to waitlist",
  "email": "new.user@example.com",
  "name": "New User"
}
```

If the email `new.user@example.com` already exists, you will receive a `409 Conflict` error.

### Retrieving All Waitlist Users

To get a list of all registered waitlist users, send a GET request to the `/api/v1/waitlist/emails` endpoint.

**Example using `curl`:**
```bash
curl http://localhost:3000/api/v1/waitlist/emails
```

**Expected Successful Response:**
```json
[
  {
    "id": "...",
    "email": "existing1@example.com",
    "name": "Existing User One",
    "createdAt": "...",
    "updatedAt": "..."
  },
  {
    "id": "...",
    "email": "existing2@example.com",
    "name": "Existing User Two",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

## License
This project is currently UNLICENSED, as indicated in the `package.json` file.

## Author Info

Connect with me:

-   LinkedIn: [YourLinkedInProfile](https://www.linkedin.com/in/yourusername)
-   Portfolio: [YourPortfolioWebsite](https://yourportfolio.com)
-   Twitter: [@YourTwitterHandle](https://twitter.com/yourusername)

---

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://docs.github.com/en/actions)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)