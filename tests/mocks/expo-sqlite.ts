export const openDatabaseSync = () => ({
  execSync: () => {},
  runSync: () => {},
  getFirstSync: () => null,
  getAllSync: () => [],
});

export default { openDatabaseSync };
