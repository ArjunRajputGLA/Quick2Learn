export const AppState = {
  addEventListener: () => ({ remove: () => {} }),
};
export const Platform = { OS: 'android' };
export const Dimensions = {
  get: () => ({ width: 360, height: 800 }),
};
export const Alert = { alert: () => {} };
export default { AppState, Platform, Dimensions, Alert };
