##  API Documentation

Base URL: `http://localhost:8000/api/v1`

---

###  Authentication & Users (`/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new user (`Consumer`, `Farmer`, or `Admin`) |
| `POST` | `/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/auth/me` | Private | Get current authenticated user profile |
| `PUT` | `/auth/updatedetails` | Private | Update logged-in user details |

---

###  Products (`/products`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Public | Fetch all available crops/products (with search & filtering) |
| `GET` | `/products/:id` | Public | Fetch single product details by ID |
| `POST` | `/products` | Farmer | List a new crop/product for sale |
| `PUT` | `/products/:id` | Farmer | Update an existing product listing |
| `DELETE` | `/products/:id` | Farmer / Admin | Delete a product listing |

---

###  Orders (`/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Consumer | Place a new crop purchase order |
| `GET` | `/orders/my-orders` | Private | Get orders placed by current user |
| `GET` | `/orders/:id` | Private | Get single order details |
| `PUT` | `/orders/:id/status` | Farmer / Admin | Update order status (`Pending`, `In Transit`, `Delivered`) |

---

###  Group Buying (`/group-buying`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/group-buying` | Public | Fetch all active group buying deals |
| `POST` | `/group-buying` | Farmer | Create a new group buying deal with target quantity |
| `PUT` | `/group-buying/:id/join` | Consumer | Join an active group deal with requested quintals |

---

###  Marketplace Trends (`/marketplace`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/marketplace/status` | Public | Fetch real-time Mandi crop prices, trends, and demand levels |
| `POST` | `/marketplace/status` | Admin | Add new market status/price entry |

---

###  Reviews & Ratings (`/reviews`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reviews/farmer/:farmerId` | Public | Get all reviews and average rating for a farmer |
| `POST` | `/reviews` | Consumer | Add a review for a delivered order |

---

###  Admin Management (`/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/users` | Admin | Get list of all platform users (filter by role/status) |
| `PUT` | `/admin/users/:id/approval` | Admin | Approve/Reject user accounts & send SMS/Email notifications |