const express = require("express");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userDetails.db");
let db = null;

const initializeDigitalMarketDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

initializeDigitalMarketDBAndServer();

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

app.post("/register", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const passwordLength = password.length;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `
  SELECT *
   FROM admin
   WHERE username = '${username}';`;
  const user = await db.get(userQuery);
  if (user !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `
          INSERT INTO 
          admin(username,name,password,gender,location)
          VALUES
            ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
  SELECT *
   FROM user
   WHERE username = '${username}';`;
  const user = await db.get(userQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, user.password);
    if (checkPassword === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
      response.status(200);
      response.send("Login success!");
    }
  }
});

app.post("/adminLogin", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
  SELECT *
   FROM admin
   WHERE username = '${username}';`;
  const user = await db.get(userQuery);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, user.password);
    if (checkPassword === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
      response.status(200);
      response.send("Login success!");
    }
  }
});

app.post("/couriers/", async (request, response) => {
  const courierDetails = request.body;
  console.log(courierDetails);
  const {
    courierId,
    description,
    dateOfBooked,
    currentStatus,
    deliveryDate,
    currentLocation,
  } = courierDetails;
  const addCourier = `
    INSERT INTO
    courierdetails (courierid,description,dateofbooked,currentstatus,deliverydate,currentlocation)
    VALUES (
        '${courierId}',
        '${description}',
        '${dateOfBooked}',
        '${currentStatus}',
        '${deliveryDate}',
        '${currentLocation}'
    );`;
  await db.run(addCourier);
  response.send("Player Added to Team");
});

app.put("/couriers/:courierId/", async (request, response) => {
  const { courierId } = request.params;
  const courierDetails = request.body;
  const { currentStatus, currentLocation } = courierDetails;
  const updateDetails = `
        UPDATE courierdetails
        SET
        currentstatus = '${currentStatus}',
       currentlocation = '${currentLocation}'
        WHERE courierid = ${courierId}`;

  await db.run(updateDetails);
  response.send("Player Details Updated");
});

app.delete("/couriers/:courierId/", async (request, response) => {
  const { courierId } = request.params;
  const deleteCourier = `
    DELETE FROM
   courierdetails
    WHERE courierid = ${courierId};`;
  await db.run(deleteCourier);
  response.send("Player Removed");
});

app.get("/couriers/", async (request, response) => {
  const getCouriersList = `
    SELECT *
    FROM courierdetails
    ORDER BY courierid;`;
  const couriersList = await db.all(getCouriersList);
  console.log(couriersList);
  response.send(couriersList);
});
