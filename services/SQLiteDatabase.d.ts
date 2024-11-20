declare module 'expo-sqlite' {
    export interface SQLTransactionCallback {
      (transaction: SQLTransaction): void;
    }
  
    export interface SQLResultSet {
      insertId: number;
      rowsAffected: number;
      rows: {
        length: number;
        item: (index: number) => any;
        _array: any[];
      };
    }
  
    export interface SQLError {
      code: number;
      message: string;
    }
  
    export interface SQLTransaction {
      executeSql: (
        sqlStatement: string,
        args?: any[],
        callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
        errorCallback?: (transaction: SQLTransaction, error: SQLError) => boolean
      ) => void;
    }
  
    export interface Database {
      transaction(
        callback: (transaction: SQLTransaction) => void,
        errorCallback?: (error: SQLError) => void,
        successCallback?: () => void
      ): void;
      closeAsync(): Promise<void>;
      execAsync(sql: string, args?: any[]): Promise<SQLResultSet>;
      getAsync(sql: string, args?: any[]): Promise<any[]>;
    }
  
    export function openDatabase(name: string): Database;
  }