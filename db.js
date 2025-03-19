const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const bcrypt = require('bcrypt');

const client = new Client(process.env.DATABASE_URL);

const createReservation = async({ date, party_count, restaurant_id, customer_id })=> {
    const SQL = `
      INSERT INTO reservations(id, date, party_count, restaurant_id, customer_id) VALUES($1, $2, $3, $4, $5) RETURNING *
    `;
    const response = await client.query(SQL, [uuidv4(), date, party_count, restaurant_id, customer_id]);
    return response.rows[0];
  };

  const findUserByUsername = async (username) => {
    const SQL = 'SELECT * FROM customers WHERE name = $1;';
    const response = await client.query(SQL, [username]);
    return response.rows[0];
  };

const createTables = async () => {
    const SQL = `
    DROP TABLE IF EXISTS reservations;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS restaurants;

    CREATE TABLE customers (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      password VARCHAR(100) NOT NULL
    );

    CREATE TABLE restaurants (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    );

    CREATE TABLE reservations (
      id UUID PRIMARY KEY,
      date DATE NOT NULL,
      party_count INTEGER NOT NULL,
      restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
      customer_id UUID REFERENCES customers(id) NOT NULL
    );
  ;`

    await client.query(SQL);
};

const createCustomer = async (name, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const SQL = `INSERT INTO customers(id, name, password) VALUES($1, $2, $3) RETURNING *;`;
  const response = await client.query(SQL, [uuidv4(), name, hashedPassword]);
  return response.rows[0];
};

const createRestaurant = async (name) => {
    const SQL = `
    INSERT INTO restaurants(id, name) VALUES($1, $2) RETURNING *;
    `;

    const response = await client.query(SQL, [uuidv4(), name]);
    return response.rows[0];
};

const fetchCustomers = async () => {
    const SQL = `SELECT * FROM customers;`;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchReservations = async () => {
    const SQL = `SELECT * FROM reservations;`;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchRestaurants = async () => {
    const SQL = `SELECT * FROM restaurants;`;
    const response = await client.query(SQL);
    return response.rows;
};


module.exports = { createTables, client, fetchRestaurants, createCustomer, createRestaurant, fetchCustomers, fetchReservations, createReservation, findUserByUsername }