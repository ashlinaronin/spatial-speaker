const sqlite3 = require("sqlite3").verbose();

const dbPath =
  process.env.SQLITE_DB_PATH ||
  "/Users/ashlinaronin/Development/sqlite/spatial.db";
console.log("dbPath", dbPath);

const getUser = async (userId) => {
  return new Promise((resolve, reject) => {
    let db = new sqlite3.Database(dbPath);

    db.get(`SELECT * FROM user WHERE userId = "${userId}"`, (err, userRow) => {
      if (err) reject(err);
      resolve(userRow);
      db.close();
    });
  });
};

const registerUser = (userId, teamId) => {
  let db = new sqlite3.Database(dbPath);

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

    db.close();
  });
};

const addRecording = (userId, fileId, filePath) => {
  let db = new sqlite3.Database(dbPath);

  const userFileStatement = db.prepare(
    "INSERT INTO user_file (fileId, userId, filePath) VALUES (?,?,?)"
  );
  userFileStatement.run(fileId, userId, filePath);
  userFileStatement.finalize();

  db.close();
};

module.exports = {
  getUser,
  registerUser,
  addRecording,
};
