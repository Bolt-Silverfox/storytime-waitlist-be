# StoryTime Waitlist API 📚

## Overview
This is a robust backend service developed with TypeScript, NestJS, and Prisma, designed to efficiently manage waitlist subscriptions for the StoryTime platform. It handles user registration, stores data in a PostgreSQL database, and sends personalized welcome emails using React Email and Nodemailer. This project emphasizes clean architecture, API documentation, and maintainability.

## Features
- **Waitlist Management**: Securely add and retrieve user entries for the StoryTime platform.
- **Automated Email Notifications**: Sends personalized welcome emails upon successful waitlist subscription using React Email and Nodemailer.
- **Data Persistence**: Leverages PostgreSQL as the relational database and Prisma ORM for type-safe database interactions and migrations.
- **RESTful API Design**: Provides a clean and intuitive API following REST principles, exposed via a global prefix `api/v1`.
- **Interactive API Documentation**: Integrated Swagger UI for comprehensive API exploration and testing.
- **Scalable Architecture**: Built with NestJS, promoting modularity, dependency injection, and enterprise-grade application development.
- **Data Validation**: Ensures data integrity with `class-validator` and global `ValidationPipe` for all incoming requests.

## Technologies Used
| Technology         | Description                                                                 | Link                                                        |
| :----------------- | :-------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **NestJS**         | Progressive Node.js framework for building efficient, reliable, and scalable server-side applications. | [NestJS](https://nestjs.com/)                               |
| **TypeScript**     | Superset of JavaScript that adds optional static typing to the language.    | [TypeScript](https://www.typescriptlang.org/)               |
| **Prisma**         | Next-generation Node.js and TypeScript ORM for robust database access.      | [Prisma](https://www.prisma.io/)                            |
| **PostgreSQL**     | Powerful, open-source object-relational database system.                   | [PostgreSQL](https://www.postgresql.org/)                   |
| **Nodemailer**     | Module for Node.js applications to allow easy email sending.               | [Nodemailer](https://nodemailer.com/)                       |
| **React Email**    | Write and style your emails using React components for rich templates.      | [React Email](https://react.email/)                         |
| **Swagger UI**     | Visualize and interact with the API's resources directly from the browser.  | [Swagger](https://swagger.io/)                              |
| **ESLint**         | Pluggable linting utility for JavaScript and TypeScript.                    | [ESLint](https://eslint.org/)                               |
| **Prettier**       | An opinionated code formatter ensuring consistent code style.                | [Prettier](https://prettier.io/)                            |
| **Jest**           | Delightful JavaScript Testing Framework with a focus on simplicity.         | [Jest](https://jestjs.io/)                                  |

## Getting Started

### Installation
To get a local copy of this project up and running, follow these step-by-step instructions.

- ⚙️ **Clone the Repository**: Start by cloning the project to your local machine.
  ```bash
  git clone https://github.com/Bolt-Silverfox/storytime-waitlist-be.git
  cd storytime-waitlist-be
  ```
- 📦 **Install Dependencies**: Install all necessary project dependencies using npm or yarn.
  ```bash
  npm install
  # or
  yarn install
  ```
- 🛠️ **Generate Prisma Client**: Ensure the Prisma client is generated to interact with your database.
  ```bash
  npm run db:generate
  ```
- 💾 **Run Database Migrations**: Before starting the application, apply the database schema migrations. Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL` environment variable.
  ```bash
  npm run db:migrate
  ```

### Environment Variables
The application requires several environment variables to function correctly. Create a `.env` file in the project root directory and populate it with the following:

| Variable        | Example                                                | Description                                    |
| :-------------- | :----------------------------------------------------- | :--------------------------------------------- |
| `DATABASE_URL`  | `postgresql://user:pass@localhost:5432/storytime_db?schema=public` | The connection string for your PostgreSQL database. |
| `EMAIL_HOST`    | `smtp.gmail.com`                                       | The SMTP host for sending emails (e.g., Gmail's SMTP). |
| `EMAIL_PORT`    | `587`                                                  | The SMTP port (commonly `587` for TLS or `465` for SSL). |
| `EMAIL_USER`    | `your-email@gmail.com`                                 | The username for SMTP authentication (your email address). |
| `EMAIL_PASS`    | `your-app-specific-password`                           | The password or app-specific password for SMTP authentication. |
| `EMAIL_FROM`    | `noreply@storytime.com`                                | The sender email address that appears in outbound emails. |

## Usage
After successfully completing the installation and environment variable setup, you can run the application.

- ▶️ **Run in Development Mode**: For development purposes, you can start the application with live-reloading.
  ```bash
  npm run start:dev
  ```
  The application will be accessible at `http://localhost:3000`, and any code changes will automatically restart the server.

- 🚀 **Run in Production Mode**: To run the optimized, compiled version of the application for production:
  First, build the project:
  ```bash
  npm run build
  ```
  Then, start the compiled application:
  ```bash
  npm run start:prod
  ```
  The production server will also be available at `http://localhost:3000`.

- 📄 **Access API Documentation**: The interactive Swagger UI documentation for all API endpoints will be available at:
  ```
  http://localhost:3000/docs
  ```

## API Documentation

### Base URL
`http://localhost:3000/api/v1`

### Endpoints

#### POST /waitlist/subscribe
Registers a new user to the StoryTime waitlist. Upon successful subscription, a welcome email is sent to the provided address.

**Request**:
Registers a user with their email and name.
```json
{
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```

**Response**:
Indicates successful subscription to the waitlist.
```json
{
  "message": "Successfully added to waitlist",
  "email": "john.doe@example.com",
  "name": "John Doe"
}
```

**Errors**:
- `400 Bad Request`: Occurs if the request payload is invalid (e.g., malformed email, missing name, or `name` not meeting length requirements).
- `409 Conflict`: Returned if the provided email address is already registered in the waitlist.

#### GET /waitlist/emails
Retrieves a list of all users currently registered on the waitlist. This endpoint is typically intended for administrative access.

**Request**:
_No request body required._

**Response**:
A JSON array containing details of all waitlist users.
```json
[
  {
    "id": "clz7m6qbc0000r6s60n3h91m4",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  },
  {
    "id": "clz7m6qbc0001r6s60n3h91m5",
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "createdAt": "2023-10-26T09:30:00.000Z",
    "updatedAt": "2023-10-26T09:30:00.000Z"
  }
]
```

**Errors**:
- _(No explicit API error responses are defined in the application logic for this endpoint, beyond generic server errors.)_

#### GET /waitlist/emails/paginated
Retrieves a paginated list of waitlist users, allowing for efficient fetching of large datasets.

**Request**:
_Query Parameters:_
- `page`: (Optional) Specifies the page number to retrieve. Defaults to `1` if not provided.
- `limit`: (Optional) Specifies the maximum number of items per page. Defaults to `10` if not provided.

_Example Query:_ `/api/v1/waitlist/emails/paginated?page=2&limit=5`

**Response**:
A JSON object containing an array of waitlist users for the specified page, along with pagination metadata.
```json
{
  "data": [
    {
      "id": "clz7m6qbc0002r6s60n3h91m6",
      "email": "alice.wonderland@example.com",
      "name": "Alice Wonderland",
      "createdAt": "2023-10-25T11:45:00.000Z",
      "updatedAt": "2023-10-25T11:45:00.000Z"
    },
    {
      "id": "clz7m6qbc0003r6s60n3h91m7",
      "email": "bob.builder@example.com",
      "name": "Bob Builder",
      "createdAt": "2023-10-24T14:20:00.000Z",
      "updatedAt": "2023-10-24T14:20:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "lastPage": 10,
    "currentPage": 2,
    "perPage": 10
  }
}
```

**Errors**:
- _(No explicit API error responses are defined in the application logic for this endpoint, beyond generic server errors.)_

## License
This project is licensed under the UNLICENSED license.

## Author Info

Connect with me:

- LinkedIn: [Your LinkedIn Profile](https://www.linkedin.com/in/yourusername/)
- Twitter: [@YourTwitterHandle](https://twitter.com/YourTwitterHandle)
- Portfolio: [Your Portfolio Website](https://www.yourportfolio.com)

## Badges
[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Swagger](https://img.shields.io/badge/Swagger-%2385EA2D.svg?style=for-the-badge&logo=swagger&logoColor=white)](https://swagger.io/)
[![React Email](https://img.shields.io/badge/React_Email-000000?style=for-the-badge&logo=react&logoColor=white)](https://react.email/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)