var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  port     : '3366',
  user     : 'root',
  password : '1234',
  database : 'nodejssql'
});

connection.connect();

connection.query('SELECT * FROM topic', function (error, results, fields) {
  if (error) console.error(error.stack);
  else console.log(results);
});

connection.end();
