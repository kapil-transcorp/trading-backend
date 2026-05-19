# AI Trading Backend - API Documentation

## Base URL
`http://localhost:5000/api`

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 1. AUTH MODULE APIs

### Register User
`POST /auth/register`
Body:
```json
{
  "name": "Kapil",
  "email": "kapil@gmail.com",
  "phone": "9999999999",
  "password": "12345678"
}
```

### Verify OTP
`POST /auth/verify-otp`
Body:
```json
{
  "phone": "9999999999",
  "otp": "1234"
}
```

### Login
`POST /auth/login`
Body:
```json
{
  "email": "kapil@gmail.com",
  "password": "12345678"
}
```

### Refresh Token
`POST /auth/refresh-token`
Body:
```json
{
  "refreshToken": "..."
}
```

---

## 2. USER MODULE APIs

### Get Profile
`GET /user/profile` (Auth required)

### Update Profile
`PUT /user/profile` (Auth required)
Body:
```json
{
  "name": "New Name",
  "phone": "9999999999"
}
```

### Add Bank Account
`POST /user/bank-account` (Auth required)
Body:
```json
{
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234",
  "bank_name": "State Bank of India",
  "account_holder_name": "Kapil"
}
```

---

## 3. WALLET MODULE APIs

### Add Money (Razorpay)
`POST /wallet/add-money` (Auth required)
Body:
```json
{
  "amount": 10000
}
```

### Verify Payment
`POST /wallet/verify-payment` (Auth required)
Body:
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

### Wallet Balance
`GET /wallet/balance` (Auth required)

---

## 4. STOCK MARKET APIs

### Search Stocks
`GET /stocks/search?q=tata`

### Live Stock Price
`GET /stocks/live/:symbol`

### Watchlist Add
`POST /stocks/watchlist` (Auth required)
Body:
```json
{
  "stock_id": "uuid-of-stock"
}
```

---

## 5. TRADING APIs

### Buy Stock
`POST /trade/buy` (Auth required)
Body:
```json
{
  "symbol": "TCS",
  "quantity": 10,
  "price": 3500
}
```

### Sell Stock
`POST /trade/sell` (Auth required)
Body:
```json
{
  "symbol": "TCS",
  "quantity": 10
}
```

---

## 6. AUTOMATION TRADING APIs

### Create Automation
`POST /automation/create` (Auth required)
Body:
```json
{
  "symbol": "TCS",
  "quantity": 10,
  "buy_price": 3500,
  "target_profit_percent": 5,
  "stop_loss_percent": 2,
  "loop_enabled": true,
  "start_time": "2026-05-14 09:15:00",
  "end_time": "2026-05-14 15:20:00"
}
```

---

## 7. ADMIN APIs

### Admin Login
`POST /admin/login`

### Dashboard Stats
`GET /admin/dashboard` (Admin required)
