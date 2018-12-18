const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const routes = require('./route');
const cors = require('cors');

app.use(bodyParser.json({limit:'100mb'}));
app.use(bodyParser.urlencoded({extended:true,limit:'100mb'}));


var corsOptions = {
    origin: 'http://localhost:4200/',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
  app.use(cors());
  require('./route')(app);
  app.listen('3000');
