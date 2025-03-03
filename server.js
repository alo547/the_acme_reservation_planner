const { fetchRestaurants, createCustomer, createRestaurant, fetchCustomers, client, createTables, createReservation, fetchReservations } = require ("./db.js");
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/customers', async(req, res, next)=> {
    try {
      res.send(await fetchCustomers());
    }
    catch(ex){
      next(ex);
    }
  });

  app.post('/api/customers', async(req, res, next)=> {
    try {
        const { name } = req.body;
      res.send(await createCustomer(name));
    }
    catch(ex){
      next(ex);
    }
  });

  app.post('/api/restaurants', async(req, res, next)=> {
    try {
        const { name } = req.body;
      res.send(await createRestaurant(name));
    }
    catch(ex){
      next(ex);
    }
  });

  app.get('/api/restaurants', async(req, res, next)=> {
    try {
      res.send(await fetchRestaurants());
    }
    catch(ex){
      next(ex);
    }
  });

  app.get('/api/reservations', async(req, res, next)=> {
    try {
      res.send(await fetchReservations());
    }
    catch(ex){
      next(ex);
    }
  });

//   app.use(express.json());
  app.post('/api/customers/:id/reservations', async(req, res, next)=> {
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
    catch(ex){
      next(ex);
    }
  });

  app.delete('/api/customers/:customer_id/reservations/:id', async(req, res, next)=> {
    try {
        const SQL = `DELETE FROM reservations WHERE id = $1 RETURNING *;`;
        const response = await client.query(SQL, [req.params.id]);
        if(response.rows.length){
            res.send(response.rows[0]);
        }
        else {
            res.status(404).send({ error: 'Reservation not Found'});
        }
    }
    catch(ex){
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

      const customer = await createCustomer('new customer');
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