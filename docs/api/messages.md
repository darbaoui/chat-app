# API Documentation: Messages

This document outlines the API endpoints related to chat messages.

---

## Get Messages

Fetches a paginated list of messages for a specific chat room.

*   **Endpoint**: `GET /api/messages`
*   **Authentication**: Required (Bearer Token).

### Query Parameters

| Name       | Type   | Required | Description                                         |
| :--------- | :----- | :------- | :-------------------------------------------------- |
| `roomId`   | string | Yes      | The ID of the room to fetch messages from.          |
| `cursor`   | string | No       | The ID of the message to start fetching from (for pagination). |

### Responses

*   **`200 OK`**: Successfully retrieved messages.

    **Body:**
    ```json
    {
      "messages": [
        {
          "id": "msg_123",
          "text": "Hello world!",
          "created_at": "2023-10-27T10:00:00Z",
          "user": {
            "id": "user_abc",
            "name": "Alice",
            "avatar_url": "https://.../avatar.png"
          }
        }
      ],
      "nextCursor": "msg_122"
    }
    ```

*   **`401 Unauthorized`**: If the user is not authenticated.
*   **`404 Not Found`**: If the `roomId` does not exist.

---

## Send Message

Sends a new message to a specified chat room.

*   **Endpoint**: `POST /api/messages`
*   **Authentication**: Required (Bearer Token).

### Request Body

```json
{
  "roomId": "string",
  "text": "string"
}
```

### Responses

*   **`201 Created`**: Message sent successfully.

    **Body:** The newly created message object.
    ```json
    {
      "id": "msg_124",
      "text": "This is a new message.",
      "created_at": "2023-10-27T10:05:00Z",
      "user": { ... }
    }
    ```

*   **`400 Bad Request`**: If `roomId` or `text` is missing or invalid.
*   **`401 Unauthorized`**: If the user is not authenticated.
*   **`404 Not Found`**: If the `roomId` does not exist.