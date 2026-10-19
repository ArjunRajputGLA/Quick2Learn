export const init = () => {};
export const captureException = () => {};
export const wrap = (c: any) => c;

export interface Breadcrumb {
  message?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ErrorEvent {
  user?: { id?: string; [key: string]: unknown };
  breadcrumbs?: Breadcrumb[];
  extra?: Record<string, unknown>;
  message?: string;
  exception?: { values?: Array<{ value?: string }> };
  [key: string]: unknown;
}

export default { init, captureException, wrap };
