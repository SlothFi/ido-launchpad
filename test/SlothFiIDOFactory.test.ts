import { expect } from "chai";
import { ethers } from "hardhat";
import { SlothFiIDOFactory, FixedSupplyToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("SlothFiIDOFactory", function () {
  // test globals
  let factory: SlothFiIDOFactory;
  let wone: FixedSupplyToken;
  let gme: FixedSupplyToken;
  let tok: FixedSupplyToken;
  let mon: FixedSupplyToken;
  let admin: SignerWithAddress;

  const totalSupply = ethers.utils.parseEther("1000000");
  const offeringAmount = ethers.utils.parseEther("10000");
  const raisingAmount = ethers.utils.parseEther("1000");
  const maxContributionAmount = ethers.utils.parseEther("1000");
  const requiredCollateralAmount = ethers.utils.parseEther("100");

  it("can deploy multiple IDOs", async () => {
    [admin] = await ethers.getSigners();

    const SlothFiIDOFactory = await ethers.getContractFactory(
      "SlothFiIDOFactory"
    );
    factory = await SlothFiIDOFactory.deploy(admin.address);

    // deploy various tokens needed
    const FixedSupplyToken = await ethers.getContractFactory(
      "FixedSupplyToken"
    );
    wone = await FixedSupplyToken.deploy("Wrapped ONE", "WONE", totalSupply);
    await wone.deployed();

    gme = await FixedSupplyToken.deploy("Game Token", "GME", totalSupply);
    await gme.deployed();

    tok = await FixedSupplyToken.deploy("Game Token", "GME", totalSupply);
    await tok.deployed();

    mon = await FixedSupplyToken.deploy("DeFimons", "MON", totalSupply);
    await mon.deployed();

    const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
    const startTime = currentTime + 3600;

    // A new block is mined for each tx on hardhat network
    const endTime = currentTime + 7200;
    const claimTime = currentTime + 7500;
    await factory.createIDO(
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

    const tx = await factory.createIDO(
      wone.address,
      tok.address,
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

    const ido = await tx.wait();
    console.log("ido = ", ido);

    const idos = await factory.getAllIDOs();
    expect(idos.length).to.equal(2);
    const firstIDO = idos[0];
    // check all fields
    expect(firstIDO.startTime).to.equal(startTime);
    expect(firstIDO.endTime).to.equal(endTime);
    expect(firstIDO.claimTime).to.equal(claimTime);
    expect(firstIDO.offeringAmount).to.equal(offeringAmount);
    expect(firstIDO.raisingAmount).to.equal(raisingAmount);
  });
});
