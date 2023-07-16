const sqlite3 = require("sqlite3").verbose();

const dbPath = "/Users/ashlinaronin/Development/sqlite/spatial.db";

const addUser = (userId, teamId, fileId, filePath) => {
  let db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.get(`SELECT * FROM user WHERE userId = "${userId}"`, (err, userRow) => {
      console.log("error", err);
      // if user doesn't already exist, insert them
      if (!userRow) {
        const userStatement = db.prepare(
          "INSERT INTO user (userId, teamId) VALUES (?,?)"
        );
        userStatement.run(userId, teamId);
        userStatement.finalize();
      }

      const userFileStatement = db.prepare(
        "INSERT INTO user_file (fileId, userId, filePath) VALUES (?,?,?)"
      );
      userFileStatement.run(fileId, userId, filePath);
      userFileStatement.finalize();

      db.close();
    });
  });
};

module.exports = {
  addUser,
};
