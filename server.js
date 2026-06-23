const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
let lastHeartbeat = 0;
app.use(cors());
app.use(express.json());

// Create uploads folder
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// Database
const db = new sqlite3.Database("jarvis.db", (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log("Database Connected");
    }
});

// Create tables
db.serialize(() => {
db.run(`
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    master_password TEXT
)
`);
    db.run(`
        CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            filepath TEXT,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site TEXT,
            username TEXT,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS faces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            face_descriptor TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Database Ready");

});

// Multer
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        cb(
            null,
            Date.now() + "-" + file.originalname
        );
    }

});

const upload = multer({ storage });

// Static files
app.use("/uploads", express.static("uploads"));

app.post("/heartbeat", (req, res) => {

    const key =
    req.headers["x-device-key"];

    if(key !== "JARVIS_OM_2026"){

        return res.status(401).json({
            success:false
        });

    }

    lastHeartbeat = Date.now();

    res.json({
        success:true
    });

});

app.get("/device-status", (req, res) => {

    const online =
        (Date.now() - lastHeartbeat) < 60000;

    res.json({
        online
    });

});
// Home
app.get("/", (req, res) => {

    res.json({
        success: true,
        server: "JARVIS",
        status: "ONLINE"
    });

});

// Upload Photo
app.post(
    "/upload",
    upload.single("photo"),
    (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        db.run(
            "INSERT INTO photos(filename, filepath) VALUES(?, ?)",
            [
                req.file.filename,
                req.file.path
            ],
            function (err) {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true
                });

            }
        );

    }
);

// Get Photos
app.get("/photos", (req, res) => {

    db.all(
        "SELECT * FROM photos ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json(rows);

        }
    );

});

// Save Password
app.post("/passwords", (req, res) => {

    const { site, username, password } = req.body;

    db.run(
        "INSERT INTO passwords(site, username, password) VALUES(?, ?, ?)",
        [site, username, password],
        function (err) {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true
            });

        }
    );

});

// Get Passwords
app.get("/passwords", (req, res) => {

    db.all(
        "SELECT * FROM passwords ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json(rows);

        }
    );

});

// Register Face
app.post("/face/register", (req, res) => {

    const { descriptor } = req.body;

    db.run(
        "DELETE FROM faces",
        [],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            db.run(
                "INSERT INTO faces(face_descriptor) VALUES(?)",
                [JSON.stringify(descriptor)],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            success: false
                        });
                    }

                    res.json({
                        success: true
                    });

                }
            );

        }
    );

});

// Get Face
app.get("/face", (req, res) => {

    db.get(
        "SELECT * FROM faces LIMIT 1",
        [],
        (err, row) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            if (!row) {
                return res.json({
                    success: false,
                    message: "No face registered"
                });
            }

            res.json({
                success: true,
                face_descriptor: row.face_descriptor
            });

        }
    );

});

// Delete Face
app.delete("/face", (req, res) => {

    db.run(
        "DELETE FROM faces",
        [],
        function (err) {

            if (err) {
                return res.status(500).json({
                    success: false
                });
            }

            res.json({
                success: true
            });

        }
    );

});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `JARVIS SERVER RUNNING ON PORT ${PORT}`
    );

});