const fs = require('fs');
const path = require('path');
const walk = require('fs-walk');
const xml2js = require('xml2js');

let rules = [];
let parser = new xml2js.Parser();

let dirPath = '/tmp/https-everywhere/src/chrome/content/rules';
// let dirPath = __dirname + '/xml';

walk.files(dirPath, (basedir, filename, stat, next) => {
  return parseFile(path.join(basedir, filename), next);
},
(err) => {
  if (err) { console.log('Walk Error: ' + err); }
  console.log('done');

  let outputPath = path.join(__dirname, 'json', 'rules.json');
  fs.writeFile(outputPath, JSON.stringify(rules, null, 2), (err) => {
    if (err) { return console.log(err); }
    else {
      console.log('wrote file');
    }
  });
});


function parseFile(filepath, cb) {
  let file = fs.readFileSync(filepath, 'utf8');
  parser.parseString(file, (err, result) => {
    if (err) { return cb(err); }

    result.ruleset.target.forEach((target) => {
      rules.push(target.$.host);
    });

    return cb();
  });
}
