// stores/transactionsStore.ts
import { create } from "zustand";
import db from "../database/db";

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
}

interface TransactionStore {
  transactions: Transaction[];
  loadTransactions: () => void;
  addTransaction: (data: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: number) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],

  loadTransactions: () => {
    db.transaction((tx: any) => {
      tx.executeSql(
        "SELECT * FROM transactions ORDER BY date DESC;",
        [],
        (_: null, result: { rows: { _array: Transaction[] } }) => {
          set({ transactions: result.rows._array as Transaction[] });
        },
        (_: null, error: Error) => {
          console.error("Error al cargar transacciones:", error);
          return false;
        }
      );
    });
  },

  addTransaction: (data) => {
    const { type, amount, description, date } = data;
    db.transaction((tx: any) => {
      tx.executeSql(
        "INSERT INTO transactions (type, amount, description, date) VALUES (?, ?, ?, ?);",
        [type, amount, description, date],
        (_: null, result: { insertId: number }) => {
          set((state) => ({
            transactions: [
              { id: result.insertId as number, ...data },
              ...state.transactions,
            ],
          }));
        },
        (_: null, error: Error) => {
          console.error("Error al agregar transacción:", error);
          return false;
        }
      );
    });
  },

  deleteTransaction: (id) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        "DELETE FROM transactions WHERE id = ?;",
        [id],
        (_: null, result: { rowsAffected: number }) => {
          if (result.rowsAffected > 0) {
            set((state) => ({
              transactions: state.transactions.filter((t) => t.id !== id),
            }));
          }
        },
        (_: null, error: Error) => {
          console.error("Error al eliminar transacción:", error);
          return false;
        }
      );
    });
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },
}));
