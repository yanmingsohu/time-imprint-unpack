const zlib = require('zlib');
const fs = require('fs');
const sql = require('sqlite3').verbose();

let dbfile = process.argv[2];
if (!dbfile) {
  console.log("Usage: node index $dbfilename");
  return;
}

fs.mkdirSync('./out/', {recursive: true});
let indexfilename = './out/index.html';
let db = new sql.Database(dbfile);
let mainindex = fs.createWriteStream(indexfilename);

db.serialize(function() {
  db.each("SELECT * FROM 标题", function(err, row) {
    if (err) {
      console.error(err);
      return;
    }
  
    let subdir = './out/'+ row['标题'];
    let href = row['标题'];
    try {
      fs.mkdirSync(subdir, {recursive: true});
    } catch(e) {
      subdir = './out/id_'+ row.ID;
      href = 'id_' + row.ID;
      fs.mkdirSync(subdir, {recursive: true});
    }
  
    mainindex.write(['<a href="', href, '/index.html">', row['标题'], '</a><br/>'].join(''));
  
    db.get('Select * From 资料库 Where fid=?', [row.ID], function(err, d) {
      if (err) {
        console.error(err);
        return;
      }
        
      const content = d['内容'];
      console.log(subdir);
      const subidx = ['<style> img{width:99%} </style>'];
      unzipdata(subdir, content, subidx);
      subidx.push('<a href="..">Return</a>');
      fs.writeFileSync(subdir +'/index.html', subidx.join(''));
    });
  });
});


function unzipdata(subdir, buf, subidx) {
  let data = zlib.unzipSync(buf).toString('utf8');
  //fs.writeFileSync('fid212.unzip.bin', data);
  let file_count = 0;

  for (let i=0; i<data.length;) {
    let f;
    
    f = data.indexOf('TGIFImage', i);
    if (f >= 0) {
      i = writeFile(subdir, data, f + 9, 'gif', file_count, subidx);
      ++file_count;
      continue;
    }

    f = data.indexOf('TJPEGImage', i);
    if (f >= 0) {
      i = writeFile(subdir, data, f + 10, 'jpg', file_count, subidx);  
      ++file_count;
      continue;
    }

    ++i;
  }
  return file_count;
}


function findBegin(data, i) {
  while (data[i] == '\n' || data[i] == '\r') i++;
  return i;
}


function findEnd(data, i) {
  while (data[i] != '\r' && data[i] != '\n') i++;
  return i;
}


function writeFile(subdir, data, begin, name, file_count, subidx) {
  begin = findBegin(data, begin);
  let end = findEnd(data, begin);
  let buf = Buffer.from(data.substring(begin, end), 'hex');
  let filename = file_count + '.'+ name;
  fs.writeFileSync(subdir +'/'+ filename, buf);
  subidx.push('<img src="', filename, '"/><br/>');
  return end;
}


function showString(data, i) {
  let begin = findBegin(i);
  let end = findEnd(begin);
  let buf = Buffer.from(data.substring(begin, end), 'hex');
  console.log(data.substring(begin, end));
  console.log(buf.toString('utf8'));
  return end;
}