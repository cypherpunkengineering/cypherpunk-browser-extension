const fs = require('fs');
const path = require('path');
const walk = require('fs-walk');
const xml2js = require('xml2js');

let parser = new xml2js.Parser();

let dirPath = '/tmp/https-everywhere/src/chrome/content/rules';
// let dirPath = __dirname + '/xml';

walk.files(dirPath, (basedir, filename, stat, next) => {
  return parseFile(path.join(basedir, filename), next);
},
(err) => {
  if (err) { console.log('Walk Error: ' + err); }
  console.log('done');
});


function parseFile(filepath, cb) {
  let file = fs.readFileSync(filepath, 'utf8');
  parser.parseString(file, (err, result) => {
    if (err) { return cb(err); }

    let deleted = false;

    result.ruleset.rule.forEach((rule) => {
      if ( rule.$.from.length > 6) {
        fs.unlink(filepath, () => {
          console.log('Deleted: ' + filepath);
          deleted = true;
        });
      }
    });

    if ( result.ruleset.$.default_off && !deleted ) {
      fs.unlink(filepath, () => {
        console.log('Deleted: ' + filepath);
        return cb();
      });
    }
    else if ( result.ruleset.exclusion && !deleted ) {
      fs.unlink(filepath, () => {
        console.log('Deleted: ' + filepath);
        return cb();
      });
    }
    else { return cb(); }
  });
}
