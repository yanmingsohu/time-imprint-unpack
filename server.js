const zlib = require('zlib');
const sql = require('sqlite3').verbose();

let dbfile = process.argv[2];
if (!dbfile) {
  console.log("Usage: node server $dbfilename");
  return;
}

let db = new sql.Database(dbfile);
let mainindex = ['<h3>', dbfile, '</h3>'];

db.serialize(function() {
  db.each("SELECT * FROM 标题", function(err, row) {
    if (err) {
      mainindex.push(err.message);
    } else {
      mainindex.push(row.ID, '&nbsp;', '<a href="page/', row.ID, '">', row['标题'], '</a><br/>');
    }
  });
});


var express = require('express');
var app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
  res.send(mainindex.join(''));
});


app.get('/page/:id', function(req, res) {
  console.log('GET', req.params.id);
  db.get('Select * From 资料库 Where fid=?', [req.params.id], function(err, d) {
    if (err) {
      res.send(err.message);
      return;
    }
  
    res.write('<style> img{width:99%} </style>');
    unzipdata(d['内容'], res);
    res.end("<a href='../'>Return</a>");
  });
});


app.listen(7000, () => {
  console.log('http://localhost:7000');
});


function unzipdata(buf, res) {
  let data = zlib.unzipSync(buf).toString('utf8');
  //TODO: readline
  
  for (let i=0; i<data.length;) {
    i = data.indexOf('TGIFImage', i);
    if (i >= 0) {
      i = writeFile(data, i+9, 'gif', res);
    } else {
      break;
    }
  }

  for (let i=0; i<data.length;) {
    i = data.indexOf('TJPEGImage', i);
    if (i >= 0) {
      i = writeFile(data, i+10, 'jpeg', res);
    } else {
      break;
    }
  }
}


function writeFile(data, begin, type, res) {
  begin = findBegin(data, begin);
  let end = findEnd(data, begin);
  let buf = Buffer.from(data.substring(begin, end), 'hex');
  res.write('<img src="data:image/');
  res.write(type);
  res.write(';base64,');
  res.write(buf.toString('base64'));
  res.write('"/><br/>');
  return end;
}


function findBegin(data, i) {
  while (data[i] == '\n' || data[i] == '\r') i++;
  return i;
}


function findEnd(data, i) {
  while (data[i] != '\r' && data[i] != '\n') i++;
  return i;
}