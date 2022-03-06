import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SlothIDO, FixedSupplyToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("SlothIDO", function () {
  // test globals
  let ido: SlothIDO;
  let wone: FixedSupplyToken;
  let gme: FixedSupplyToken;
  let mon: FixedSupplyToken;
  let admin: SignerWithAddress;
  let participant1: SignerWithAddress;
  let participant2: SignerWithAddress;
  let participant3: SignerWithAddress;

  const totalSupply = ethers.utils.parseEther("1000000");
  const offeringAmount = ethers.utils.parseEther("10000");
  const raisingAmount = ethers.utils.parseEther("1000");
  const maxContributionAmount = ethers.utils.parseEther("1000");
  const requiredCollateralAmount = ethers.utils.parseEther("100");

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    [admin, participant1, participant2, participant3] = [
      signers[0],
      signers[1],
      signers[2],
      signers[3],
    ];

    // deploy various tokens needed
    const FixedSupplyToken = await ethers.getContractFactory(
      "FixedSupplyToken"
    );

    wone = await FixedSupplyToken.deploy("Wrapped ONE", "WONE", totalSupply);
    await wone.deployed();

    gme = await FixedSupplyToken.deploy("Game Token", "GME", totalSupply);
    await gme.deployed();

    mon = await FixedSupplyToken.deploy("DeFimons", "MON", totalSupply);
    await mon.deployed();

    const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
    const startTime = currentTime + 3600;

    // A new block is mined for each tx on hardhat network
    const endTime = currentTime + 7200;
    const claimTime = currentTime + 7500;

    const SlothIDO = await ethers.getContractFactory("SlothIDO");
    ido = await SlothIDO.deploy(
      wone.address,
      gme.address,
      startTime,
      endTime,
      claimTime,
      offeringAmount,
      raisingAmount,
      maxContributionAmount,
      admin.address,
      mon.address,
      requiredCollateralAmount
    );
    await ido.deployed();

    // Fill participant account with collateral token and WONE
    await mon.transfer(participant1.address, requiredCollateralAmount);
    await mon.transfer(participant2.address, requiredCollateralAmount);
    await mon.transfer(participant3.address, requiredCollateralAmount);

    await wone.transfer(participant1.address, raisingAmount);
    await wone.transfer(participant2.address, raisingAmount);
    await wone.transfer(participant3.address, raisingAmount);

    // Fill IDO account with offering token
    await gme.transfer(ido.address, offeringAmount);
  });

  it("can run a complete IDO - Happy path", async () => {
    console.log("Normal workflow");
    // start ido
    // await network.provider.send("evm_increaseTime", [300]);

    // Check no initial collateral
    expect(await ido.hasCollateral(participant1.address)).to.equal(false);

    // mine some blocks to move time past start
    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    // Check that deposited collateral is the right amount
    const balanceBefore = await mon.balanceOf(participant1.address);
    await mon
      .connect(participant1)
      .approve(ido.address, requiredCollateralAmount);
    await ido.connect(participant1).depositCollateral();

    const collateralamount = await ido.requiredCollateralAmount();
    const balanceAfter = await mon.balanceOf(participant1.address);
    expect(balanceBefore.sub(collateralamount).eq(balanceAfter)).to.equal(true);
    const hasCollateral = await ido.hasCollateral(participant1.address);
    expect(hasCollateral).to.equal(true);

    // Check depositing raise token works
    const woneBalanceBefore = await wone.balanceOf(participant1.address);
    const contribution = raisingAmount; // ethers.utils.parseEther("100");
    await wone.connect(participant1).approve(ido.address, contribution);
    await ido.connect(participant1).deposit(contribution);
    const woneBalanceAfter = await wone.balanceOf(participant1.address);
    await expect(woneBalanceBefore.sub(contribution).eq(woneBalanceAfter)).to.be.true;

    const allocation = await ido.getUserAllocation(participant1.address);
    expect(allocation.eq(1000000)).to.equal(true);

    // Harvest should revert - not yet time
    await expect(ido.connect(participant1).harvest()).to.be.reverted;

    // Mine some blocks to move past claim time
    await network.provider.send("evm_increaseTime", [7200]);
    await network.provider.send("evm_mine");

    await ido.connect(participant1).harvest();
    const gmeBalanceAfter = await gme.balanceOf(participant1.address);

    // check that user is credited with GME tokens
    expect(gmeBalanceAfter.eq(offeringAmount)).to.equal(true);

    // check admin withdrawing raise tokens
    const adminBalanceBefore = await wone.balanceOf(admin.address);
    await ido.finalWithdraw(raisingAmount);
    const adminBalanceAfter = await wone.balanceOf(admin.address);
    expect(
      adminBalanceAfter.sub(raisingAmount).eq(adminBalanceBefore)
    ).to.equal(true);
  });

  it("issues refunds when overflows", async () => {
    await mon
      .connect(participant1)
      .approve(ido.address, requiredCollateralAmount);
    await mon
      .connect(participant2)
      .approve(ido.address, requiredCollateralAmount);
    await mon
      .connect(participant3)
      .approve(ido.address, requiredCollateralAmount);

    // mine some blocks to move time past start
    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    // deposit collateral
    await ido.connect(participant1).depositCollateral();
    await ido.connect(participant2).depositCollateral();
    await ido.connect(participant3).depositCollateral();

    const maxAmount = raisingAmount;

    await wone.connect(participant1).approve(ido.address, maxAmount);
    await wone.connect(participant2).approve(ido.address, maxAmount);
    await wone.connect(participant3).approve(ido.address, maxAmount);

    await ido.connect(participant1).deposit(maxAmount);
    await ido.connect(participant2).deposit(maxAmount.div(2));
    await ido.connect(participant3).deposit(maxAmount.div(10));

    // mine some blocks to move time past end
    await network.provider.send("evm_increaseTime", [7200]);
    await network.provider.send("evm_mine");

    await ido.connect(participant1).harvest();
    await ido.connect(participant2).harvest();
    await ido.connect(participant3).harvest();

    const balance1 = await gme.balanceOf(participant1.address);
    const balance2 = await gme.balanceOf(participant2.address);
    const balance3 = await gme.balanceOf(participant3.address);

    // check balances are proportionally equal to contributions
    expect(balance1.div(2).eq(balance2)).to.equal(true);
    expect(balance1.div(10).eq(balance3)).to.equal(true);

    // check balances of gme, mon, one
    const adminBalanceBefore = await wone.balanceOf(admin.address);
    const withdrawAmount = raisingAmount.div(2);
    await ido.connect(admin).finalWithdraw(withdrawAmount); // test withdrawing half
    const adminBalanceAfter = await wone.balanceOf(admin.address);

    expect(
      adminBalanceAfter.eq(adminBalanceBefore.add(withdrawAmount))
    ).to.equal(true);
  });

  it("can have a max contribution", async () => {
    await mon.connect(participant1).approve(ido.address, maxContributionAmount);

    const maxAmount = raisingAmount;

    // set lower max contribution
    await ido.setMaxContributionAmount(maxAmount.div(10));

    // mine some blocks to move time past start
    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    // deposit collateral
    await ido.connect(participant1).depositCollateral();

    await wone.connect(participant1).approve(ido.address, maxAmount);

    await expect(ido.connect(participant1).deposit(maxAmount)).to.be.reverted;
  });
});
