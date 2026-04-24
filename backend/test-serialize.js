const org = { name: "test", storageUsed: 100n, storageLimit: 100n };
const serialized = {
  ...org,
  storageUsed: org.storageUsed.toString(),
  storageLimit: org.storageLimit.toString()
};
console.log(JSON.stringify(serialized));
