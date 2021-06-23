/* eslint-disable no-undef */
/* eslint-disable max-len */
const { expect } = require("chai");

describe('Testament', function () {
  let dev, owner, doctor, alice, bob, charlie, dan, Testament, testament;
  const amount = 50;
  beforeEach(async function () {
    [dev, owner, doctor, alice, bob, charlie, dan] = await ethers.getSigners();
    Testament = await ethers.getContractFactory('Testament');
    testament = await Testament.connect(dev).deploy(owner.address, doctor.address);
    await testament.deployed();
  });

  describe('Deployment', function () {
    it('should have an owner', async function () {
      expect(await testament.owner()).to.equal(owner.address);
    });
    it('should have a doctor', async function () {
      expect(await testament.doctor()).to.equal(doctor.address);
    });
    it('should return isDead = false', async function () {
      expect(await testament.isDeceased()).to.equal(false);
    });
    it('should revert if the owner is the doctor', async function () {
      await expect(Testament.connect(dev).deploy(owner.address, owner.address)).to.be.revertedWith('Testament: owner can not be the doctor');
    });
    // it('should emit is setup is done', async function () {
    //   await expect().to.emit(testament, 'setup').withArgs(owner.address, doctor.address);
    // });
  });

  describe('Doctor', function () {
    let pronounceDead;
    beforeEach(async function () {
      pronounceDead = await testament.connect(doctor).pronouncedDead();
    });
    it('should set isDead to true', async function () {
      expect(await testament.isDeceased()).to.equal(true);
    });
    it('Should emit when the person isDead ', async function () {
      expect(pronounceDead).to.emit(testament, 'dead').withArgs(true);
    });
    it('Should revert if the owner is dead', async function () {
      await expect(testament.connect(doctor).pronouncedDead()).to.be.revertedWith('Testament: the Owner is already in Heaven or not.');
    });
    it('Should revert if you are not the doctor', async function () {
      await expect(testament.connect(alice).pronouncedDead()).to.be.revertedWith('Testament: You can not call this function you are not the doctor');
    });
  });

  describe('Owner', async function () {
    let setDoctor;
    beforeEach(async function () {
      setDoctor = await testament.connect(owner).changeDoctor(bob.address);
    });

    it('should set new doctor to bob', async function () {
      expect(await testament.doctor()).to.equal(bob.address);
    });

    it('should emit when you have a new doctor', async function () {
      expect(setDoctor).to.emit(testament, 'doctorSwapped').withArgs(bob.address);
    });

    it('should revert if want to change doctor and you are not the owner', async function () {
      await expect(testament.connect(dan).changeDoctor(alice.address)).to.be.revertedWith('Ownable: Only owner can call this function');
    });

    it('should revert if owner want to be the new doctor', async function () {
      await expect(testament.connect(owner).changeDoctor(owner.address)).to.be.revertedWith('Testament: Owner can not be set as doctor');
    });
    it('should revert if owner want to set doctor to the zero address', async function () {
      await expect(testament.connect(owner).changeDoctor(ethers.constants.AddressZero)).to.be.revertedWith('Testament: cannot be the zero address');
    });
  });

  describe('Bequeath', function () {
    let accountBalance;
    beforeEach(async function () {
      accountBalance = await owner.getBalance();
    });

    it('should bequeath fund to beneficiary', async function () {
      await testament.connect(owner).bequeath(alice.address, { gasPrice: 0, value: amount });
      expect(await testament.addressHeritageBalance(alice.address)).to.equal(amount);
      expect(await owner.getBalance()).to.equal(accountBalance.sub(amount));
    });

    it('should emit when bequeath fund to beneficiary', async function () {
      expect(await testament.connect(owner).bequeath(alice.address, { value: amount })).to.emit(testament, 'bequeathed').withArgs(alice.address, amount);
    });
    it('should revert if owner is already in heaven', async function () {
      expect(await testament.connect(doctor).pronouncedDead());
      await expect(testament.connect(owner).bequeath(charlie.address)).to.be.revertedWith('Testament: the owner is dead you can not bequeath to anyone anymore');
    });

    it('should revert if owner is not the one to bequeath', async function () {
      await expect(testament.connect(alice).bequeath(charlie.address)).to.be.revertedWith('Ownable: Only owner can call this function');
    });
    it('should revert if owner try to devolve to zero address', async function () {
      await expect(testament.connect(owner).bequeath(ethers.constants.AddressZero)).to.be.revertedWith('Testament: transfer to zero address');
    });
  });

  describe('WithdrawHeritage', function () {
    it('should revert if owner is still alive', async function () {
      await expect(testament.connect(alice).withdrawHeritage()).to.be.revertedWith('Testament: The person is not dead yet');
    });
  });
});
