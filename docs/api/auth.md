# API Documentation: Authentication

This document outlines the API endpoints related to user authentication.

---

## User Login

Authenticates a user with their credentials and returns a JSON Web Token (JWT).

*   **Endpoint**: `POST /api/auth/login`
*   **Authentication**: None.

### Request Body

```json
{
  "email": "string",
  "password": "string"
}
```

### Responses

*   **`200 OK`**: Login successful.

    **Body:**
    ```json
    {
      "token": "ey...your.jwt.here"
    }
    ```

*   **`400 Bad Request`**: If `email` or `password` is missing or malformed.

*   **`401 Unauthorized`**: If the credentials are invalid.
    **Body:**
    ```json
    {
      "error": "Invalid email or password"
    }
    ```