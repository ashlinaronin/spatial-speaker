const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('/Users/ashlinaronin/Development/sqlite/spatial.db');

db.serialize(() => {
    db.all("SELECT * FROM team", (err, rows) => {
        console.log("error", err);
        console.log("rows", rows);
    })
})

db.close();