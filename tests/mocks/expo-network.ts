export const getNetworkStateAsync = async () => ({
  isConnected: true,
  isInternetReachable: true,
});
export const addNetworkStateListener = () => ({
  remove: () => {},
});
export default { getNetworkStateAsync, addNetworkStateListener };
