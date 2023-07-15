CREATE TABLE team (
    teamId INTEGER PRIMARY KEY,
    symbol TEXT,
);

INSERT INTO team(teamid, symbol)
VALUES (1, "earth"), (2, "wind"), (3, "fire"), (4, "water");


CREATE TABLE user (
    userId TEXT PRIMARY KEY,
    teamId INTEGER,
    FOREIGN KEY (teamId) REFERENCES team (teamId)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);


CREATE TABLE user_file (
    fileId TEXT PRIMARY KEY,
    filePath TEXT UNIQUE,
);