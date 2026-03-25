export interface GoogleSheetCsvParser<T> {
  parse(csvText: string): T;
}
