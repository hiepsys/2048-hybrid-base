async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with', deployer.address);

  const Leaderboard = await ethers.getContractFactory('Leaderboard');
  const lb = await Leaderboard.deploy();
  await lb.deployed();

  console.log('Leaderboard deployed to:', lb.address);
}

main().catch((err) => { console.error(err); process.exit(1); });
