const { fetchRestaurants, createCustomer, createRestaurant, fetchCustomers, client, createTables, createReservation, fetchReservations } = require("./db.js");
const express = require('express');
const axios = require("axios");
const app = express();
const bcrypt = require('bcrypt');
const { findUserByUsername } = require('./db.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'your_default_secret_key';

const generateToken = (user) => {
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1h' });
  return token;
};

const authenticate = async ({ username, password }) => {
  const user = await findUserByUsername(username);
  if (!user) {
    console.log('user not found')
    throw new Error('User not found');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log('Password does not match')
    throw new Error('Password does not match');
  }
  const token = generateToken(user);
  return token;
}

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
console.log("CLIENT_ID:", CLIENT_ID);

app.get("/auth/github", (req, res) => {
  const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:3000/auth/github/callback`;
  res.redirect(githubAuthURL);
});
app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: "https://localhost:3000/auth/github/callback",
      },
      {
        headers: {
          accept: "application/json",
        },
      }
    );
    const access_token = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = userResponse.data;
    console.log("GitHub User:", userData);

    let user = await findUserByUsername(userData.login);
    if (!user) {
      const randomPassword = Math.random()
      user = await createCustomer(userData.login, randomPassword);
      console.log("New customer created:", user);
    }
    const token = generateToken(user);

    res.send({ token });

  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.status(500).send("Authentication failed");
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const token = await authenticate(req.body);
    res.send({ token });
  } catch (ex) {
    console.log(ex)
    res.status(401).send({ error: 'Invalid credentials' });
  }
});

app.get('/api/customers', async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  }
  catch (ex) {
    next(ex);
  }
});

app.post('/api/customers', async (req, res, next) => {
  try {
    const { name, password } = req.body;
    res.send(await createCustomer(name, password));
  }
  catch (ex) {
    next(ex);
  }
});

app.post('/api/restaurants', async (req, res, next) => {
  try {
    const { name } = req.body;
    res.send(await createRestaurant(name));
  }
  catch (ex) {
    next(ex);
  }
});

app.get('/api/restaurants', async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  }
  catch (ex) {
    next(ex);
  }
});

app.get('/api/reservations', async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  }
  catch (ex) {
    next(ex);
  }
});

//   app.use(express.json());
app.post('/api/customers/:id/reservations', async (req, res, next) => {
  try {
    const { date, party_count, restaurant_id } = req.body;
    const reservation = await createReservation({
      date,
      party_count,
      restaurant_id,
      customer_id: req.params.id
    });
    res.status(201).send(reservation);
    //   res.status(201).send(reservation);
  }
  catch (ex) {
    next(ex);
  }
});

app.delete('/api/customers/:customer_id/reservations/:id', async (req, res, next) => {
  try {
    const SQL = `DELETE FROM reservations WHERE id = $1 RETURNING *;`;
    const response = await client.query(SQL, [req.params.id]);
    if (response.rows.length) {
      res.send(response.rows[0]);
    }
    else {
      res.status(404).send({ error: 'Reservation not Found' });
    }
  }
  catch (ex) {
    next(ex);
  }
});



const init = async () => {
  try {
    console.log('connecting to database');
    await client.connect();
    console.log('connected to database');

    await createTables();
    console.log('created tables');

    const customer = await createCustomer('new customer', 'password');
    console.log('Customer Created:', customer);


    const restaurant = await createRestaurant('new restaurant');
    console.log('Restaurant Created:', restaurant);

    const reservation = await createReservation({
      date: '2025-03-01',
      party_count: 4,
      restaurant_id: restaurant.id,
      customer_id: customer.id
    });
    console.log('Reservation Created:', reservation);
    console.log('Customers:', await fetchCustomers());
    console.log('Restaurants:', await fetchRestaurants());
    console.log('Reservations:', await fetchReservations());

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  }
  catch (ex) {
    console.error(ex);
  }
};
init();