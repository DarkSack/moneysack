import { openDatabaseSync, SQLiteDatabase } from "expo-sqlite";

const db = openDatabaseSync("database.db") as SQLiteDatabase & {
  transaction: (
    callback: (tx: any) => void,
    error?: (error: any) => void,
    success?: () => void
  ) => void;
};

// Crear tablas si no existen
export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
            amount REAL NOT NULL CHECK (amount > 0),
            description TEXT,
            date TEXT NOT NULL
          );`
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            targetAmount REAL NOT NULL CHECK (targetAmount > 0),
            savedAmount REAL DEFAULT 0 CHECK (savedAmount >= 0),
            deadline TEXT
          );`
        );
      },
      (error) => {
        console.error('Error creating tables:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve(true);
      }
    );
  });
};

export default db;