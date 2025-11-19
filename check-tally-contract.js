const hre = require("hardhat");

async function main() {
  const tallyAddress = "0x196D5f3E59DFA2042A6883BA34679613aE8702D5";
  
  const code = await hre.ethers.provider.getCode(tallyAddress);
  
  console.log("Contract at", tallyAddress);
  console.log("Has code:", code !== "0x");
  
  // Try to get contract name from artifacts
  const TallyVoucher = await hre.ethers.getContractFactory("TallyVoucher");
  const tally = TallyVoucher.attach(tallyAddress);
  
  try {
    const member0 = await tally.trinityMembers(0);
    console.log("Trinity member 0:", member0);
    console.log("This is TallyVoucher contract");
    
    // Check if genesis has vouched
    const hasVouched = await tally.hasVouched("0xdc20d621a88cb8908e8e7042431c55f0e9dac6fb");
    console.log("Genesis has vouched:", hasVouched);
  } catch (e) {
    console.log("Error:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
