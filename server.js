const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true only if HTTPS
  })
);

// ================= DATABASE CONNECTION =================

const db = mysql.createConnection({
  host: "localhost",
  user: "gopi",          // your MySQL username
  password: "1234",      // your MySQL password
  database: "iplticketbooking",  // your database name
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to database");
  }
});

// ================= REGISTER =================

app.post("/register", (req, res) => {
  const { name, email, phone, password } = req.body;

  const query =
    "INSERT INTO Users (name, email, phone, password) VALUES (?, ?, ?, ?)";

  db.query(query, [name, email, phone, password], (err) => {
    if (err) {
      console.log(err);
      res.send("Error registering user.");
    } else {
      res.redirect("/login.html");
    }
  });
});

// ================= LOGIN =================

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM Users WHERE email = ?";

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: "Login error." });
    } else if (results.length === 0) {
      res.json({ success: false, message: "Email not found." });
    } else if (results[0].password !== password) {
      res.json({ success: false, message: "Incorrect password." });
    } else {
      req.session.userId = results[0].user_id;
      res.json({ success: true });
    }
  });
});

// ================= BOOK TICKET =================

app.post("/book", (req, res) => {
  const { match_name, venue, match_date, seat_type, seats } = req.body;
  const user_id = req.session.userId;

  if (!user_id) {
    return res.status(401).send("User not logged in.");
  }

  const query =
    "INSERT INTO Bookings (user_id, match_name, venue, match_date, seat_type, seats) VALUES (?, ?, ?, ?, ?, ?)";

  db.query(
    query,
    [user_id, match_name, venue, match_date, seat_type, seats],
    (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error booking ticket.");
      } else {
        res.redirect("/view-ticket.html");
      }
    }
  );
});

// ================= VIEW BOOKING DETAILS =================

app.get("/api/booking-details", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "User not logged in." });
  }

  const query =
    "SELECT match_name, venue, match_date, seat_type, seats FROM Bookings WHERE user_id = ? ORDER BY booking_id DESC LIMIT 1";

  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching booking details." });
    } else if (results.length === 0) {
      res.status(404).json({ error: "No bookings found." });
    } else {
      res.json(results[0]);
    }
  });
});

// ================= SERVER START =================

app.listen(3000, () => {
  console.log("Server running on port 3000");
});