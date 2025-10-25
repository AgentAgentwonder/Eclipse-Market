use duckdb::Connection;
use std::path::Path;

pub struct MarketDB {
    conn: Connection
}

impl MarketDB {
    pub fn new(path: &Path) -> Self {
        let conn = Connection::open(path).unwrap();
        Self { conn }
    }

    pub fn initialize(&self) {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY,
                timestamp DATETIME,
                pair TEXT,
                amount REAL,
                price REAL
            )"
        ).unwrap();
    }
}
