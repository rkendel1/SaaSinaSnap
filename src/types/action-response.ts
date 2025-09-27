export type ActionResponse<T = unknown> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: string | Error;
    }
  | undefined;
