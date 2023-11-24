import { expect } from "chai";
import exp from "constants";
import { Contract, Signer } from "ethers";

enum Hand {
  Rock, // 0
  Scissors, // 1
  Paper, // 2
}

enum GameStatus {
  Not_Initialized, // 0
  Initialized, // 1
  InProgress, // 2
  Completed, // 3
}

describe("Rock Paper Scissors Game Contract", function () {
  let gameContract: Contract;
  let owner: Signer;
  let player: Signer;
  let other: Signer;
  let initialParticipationFee: any;
  let currentGameID: any;
  let ownerHandHashRock: string;
  let ownerHandHashScissor: string;
  let ownerHandHashPaper: string;
  let commitment: string;
  let increasedParticipationFee = ethers.utils.parseEther("0.15"); // 0.15 ETH
  let decreasedParticipationFee = ethers.utils.parseEther("0.05"); // 0.15 ETH

  beforeEach(async function () {
    // Deploy the contract before each test
    const Game = await ethers.getContractFactory("Game");
    [owner, player, other] = await ethers.getSigners();
    initialParticipationFee = ethers.utils.parseEther("0.1"); // 0.1 ETH

    gameContract = await Game.deploy(initialParticipationFee);
    await gameContract.deployed();

    // console.log(gameContract.address);

    // Common setup for tests
    commitment = ethers.utils.formatBytes32String("random");
    ownerHandHashRock = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Rock, commitment]
    ); // Assuming Hand.Rock is ROCK
    ownerHandHashScissor = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Scissors, commitment]
    ); // Assuming Hand.Scissors is Scissors
    ownerHandHashPaper = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Paper, commitment]
    ); // Assuming Hand.Paper is Paper
  });

  it("Should initialize a game correctly with ownerHandHashRock", async function () {
    const tx = await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await tx.wait();

    currentGameID = await gameContract.currentGameID();
    const gameInfo = await gameContract.gameList(currentGameID.sub(1));
    expect(gameInfo.status).to.equal(1); // 1 represents INITIALIZED status
    expect(currentGameID).to.equal(1);
  });

  it("Should initialize a game correctly with ownerHandHashScissor", async function () {
    const tx = await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashScissor, { value: initialParticipationFee });
    await tx.wait();

    currentGameID = await gameContract.currentGameID();
    const gameInfo = await gameContract.gameList(currentGameID.sub(1));
    expect(gameInfo.status).to.equal(1); // 1 represents INITIALIZED status
    expect(currentGameID).to.equal(1);
  });

  it("Should initialize a game correctly with ownerHandHashPaper", async function () {
    const tx = await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashPaper, { value: initialParticipationFee });
    await tx.wait();

    currentGameID = await gameContract.currentGameID();
    const gameInfo = await gameContract.gameList(currentGameID.sub(1));
    expect(gameInfo.status).to.equal(1); // 1 represents INITIALIZED status
    expect(currentGameID).to.equal(1);
  });

  it("Should reject when the initializing amout is not enough", async function () {
    await expect(
      gameContract
        .connect(owner)
        .initializeGame(ownerHandHashRock, { value: decreasedParticipationFee })
    ).to.be.revertedWith("deposit amount error");
  });

  it("Should reject when the join amout is not enough", async function () {
    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: increasedParticipationFee });

    await expect(
      gameContract
        .connect(player)
        .join(0, Hand.Rock, { value: decreasedParticipationFee })
    ).to.be.revertedWith("deposit amount mismatch");
  });

  it("Should be callable by the owner and fail by other", async function () {
    const tx_owner = gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await expect(tx_owner).to.not.be.reverted;

    const tx_nonOwner = gameContract
      .connect(player)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await expect(tx_nonOwner).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should allow a player to join an initialized game", async function () {
    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: increasedParticipationFee });

    await expect(
      gameContract
        .connect(owner)
        .join(0, Hand.Rock, { value: increasedParticipationFee })
    ).to.be.revertedWith("Cannot play alone");

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashScissor, { value: initialParticipationFee });

    const tx = await gameContract
      .connect(player)
      .join(0, Hand.Scissors, { value: increasedParticipationFee }); // 0 for gameID and ROCK
    await tx.wait();

    const gameInfo = await gameContract.gameList(0);
    expect(gameInfo.status).to.equal(GameStatus.InProgress);
    expect(gameInfo.player).to.equal(await player.getAddress());
    expect(gameInfo.playerHand).to.equal(Hand.Scissors);

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashPaper, { value: initialParticipationFee });

    await expect(
      gameContract
        .connect(player)
        .join(4, Hand.Paper, { value: initialParticipationFee })
    ).to.be.revertedWith("invalid game ID");
    await expect(
      gameContract
        .connect(player)
        .join(0, Hand.Paper, { value: initialParticipationFee })
    ).to.be.revertedWith("invalid game ID");
  });

  it("Should correctly judge a game", async function () {
    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(0, Hand.Scissors, { value: initialParticipationFee });

    let tx = await gameContract.connect(owner).judge(0, commitment);
    await tx.wait();

    let gameInfo = await gameContract.gameList(0);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashPaper, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(1, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(1, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(1);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashScissor, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(2, Hand.Paper, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(2, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(2);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashScissor, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(3, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(3, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(3);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await player.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashPaper, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(4, Hand.Scissors, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(4, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(4);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await player.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(5, Hand.Paper, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(5, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(5);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await player.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(6, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(6, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(6);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(ethers.constants.AddressZero);

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashPaper, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(7, Hand.Paper, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(7, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(7);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(ethers.constants.AddressZero);

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashScissor, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(8, Hand.Scissors, { value: initialParticipationFee });

    tx = await gameContract.connect(owner).judge(8, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(8);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(ethers.constants.AddressZero);
  });

  it("Should correctly judgewithHand a game", async function () {
    const correctCommitment = ethers.utils.formatBytes32String("correct");
    const correctOwnerHandHashScissor = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Scissors, correctCommitment]
    );
    const correctOwnerHandHashPaper = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Paper, correctCommitment]
    );
    const correctOwnerHandHashRock = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Rock, correctCommitment]
    );

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });
    await gameContract
      .connect(player)
      .join(0, Hand.Scissors, { value: initialParticipationFee });

    let tx = await gameContract
      .connect(owner)
      .judgeWithHand(0, Hand.Rock, correctCommitment);
    await tx.wait();

    let gameInfo = await gameContract.gameList(0);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(correctOwnerHandHashPaper, {
        value: initialParticipationFee,
      });
    await gameContract
      .connect(player)
      .join(1, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(1, Hand.Paper, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(1);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(correctOwnerHandHashScissor, {
        value: initialParticipationFee,
      });
    await gameContract
      .connect(player)
      .join(2, Hand.Paper, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(2, Hand.Scissors, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(2);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(correctOwnerHandHashScissor, {
        value: initialParticipationFee,
      });
    await gameContract
      .connect(player)
      .join(3, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(3, Hand.Scissors, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(3);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await player.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(correctOwnerHandHashPaper, {
        value: initialParticipationFee,
      });
    await gameContract
      .connect(player)
      .join(4, Hand.Scissors, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(4, Hand.Paper, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(4);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await player.getAddress());

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });
    await gameContract
      .connect(player)
      .join(5, Hand.Paper, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(5, Hand.Rock, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(5);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await player.getAddress());

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });
    await gameContract
      .connect(player)
      .join(6, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(6, Hand.Rock, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(6);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(ethers.constants.AddressZero);

    await gameContract
      .connect(owner)
      .initializeGame(correctOwnerHandHashPaper, {
        value: initialParticipationFee,
      });
    await gameContract
      .connect(player)
      .join(7, Hand.Paper, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(7, Hand.Paper, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(7);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(ethers.constants.AddressZero);

    await gameContract
      .connect(owner)
      .initializeGame(correctOwnerHandHashScissor, {
        value: initialParticipationFee,
      });
    await gameContract
      .connect(player)
      .join(8, Hand.Scissors, { value: initialParticipationFee });

    tx = await gameContract
      .connect(owner)
      .judgeWithHand(8, Hand.Scissors, correctCommitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(8);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(ethers.constants.AddressZero);
  });

  it("Should correctly judgewithHand a game by player", async function () {
    const correctCommitment = ethers.utils.formatBytes32String("correct");
    const correctOwnerHandHashRock = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Rock, correctCommitment]
    );

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });
    await gameContract
      .connect(player)
      .join(0, Hand.Scissors, { value: initialParticipationFee });

    let tx = await gameContract
      .connect(player)
      .judgeWithHand(0, Hand.Rock, correctCommitment);
    await tx.wait();

    let gameInfo = await gameContract.gameList(0);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());

    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashPaper, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(1, Hand.Rock, { value: initialParticipationFee });

    tx = await gameContract.connect(player).judge(1, commitment);
    await tx.wait();

    gameInfo = await gameContract.gameList(0);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
    expect(gameInfo.winner).to.equal(await owner.getAddress());
  });

  it("Should revert with 'Wrong Commitment'", async function () {
    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await gameContract
      .connect(player)
      .join(0, Hand.Rock, { value: initialParticipationFee }); // Player joins with ROCK

    const wrongCommitment = ethers.utils.formatBytes32String("0x123..."); // Replace with an incorrect commitment value
    await expect(
      gameContract.connect(player).judge(0, wrongCommitment)
    ).to.be.revertedWith("Wrong Commitment");
  });

  it("Should allow the owner to cancel a game", async function () {
    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });

    const tx = await gameContract.connect(owner).cancel(0);
    await tx.wait();

    await expect(gameContract.connect(player).cancel(0)).to.be.rejectedWith(
      "Ownable: caller is not the owner"
    );

    const gameInfo = await gameContract.gameList(0);
    expect(gameInfo.status).to.equal(GameStatus.Completed);
  });

  it("Should not allow the owner to cancel the game in non-initialzing status", async function () {
    await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });

    await gameContract
      .connect(player)
      .join(0, Hand.Rock, { value: initialParticipationFee }); // Player joins with ROCK

    await expect(gameContract.connect(owner).cancel(0)).to.be.revertedWith(
      "Cannot cancel"
    );
  });

  it("Should allow the owner to configure the participation fee", async function () {
    const newFee = ethers.utils.parseEther("0.2"); // 0.2 ETH
    const tx = await gameContract.connect(owner).configureFee(newFee);
    await tx.wait();

    await expect(
      gameContract.connect(player).configureFee(newFee)
    ).to.be.rejectedWith("Ownable: caller is not the owner");

    const updatedFee = await gameContract.pFee();
    expect(updatedFee).to.equal(newFee);
  });

  it("Should reject in wrong status when judgewithhand", async function () {
    const correctCommitment = ethers.utils.formatBytes32String("correct");

    const correctOwnerHandHashRock = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Rock, correctCommitment]
    );

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });

    await expect(
      gameContract.connect(owner).judgeWithHand(0, Hand.Rock, correctCommitment)
    ).to.be.rejectedWith("Invalid game status");

    await expect(
      gameContract
        .connect(player)
        .judgeWithHand(0, Hand.Rock, correctCommitment)
    ).to.be.rejectedWith("Invalid game status");
  });

  it("Should reject in wrong status when judge", async function () {
    const correctCommitment = ethers.utils.formatBytes32String("correct");

    const correctOwnerHandHashRock = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Rock, correctCommitment]
    );

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });

    await expect(
      gameContract.connect(owner).judge(0, correctCommitment)
    ).to.be.rejectedWith("Invalid game status");

    await expect(
      gameContract.connect(player).judge(0, correctCommitment)
    ).to.be.rejectedWith("Invalid game status");
  });

  it("Should reject in wrong person when judge", async function () {
    const correctCommitment = ethers.utils.formatBytes32String("correct");
    const correctOwnerHandHashRock = ethers.utils.solidityKeccak256(
      ["address", "uint256", "bytes32"],
      [await owner.getAddress(), Hand.Rock, correctCommitment]
    );

    await gameContract.connect(owner).initializeGame(correctOwnerHandHashRock, {
      value: initialParticipationFee,
    });
    await gameContract
      .connect(player)
      .join(0, Hand.Scissors, { value: initialParticipationFee });

    await expect(
      gameContract.connect(other).judge(0, correctCommitment)
    ).to.be.rejectedWith("Invalid judger");

    await expect(
      gameContract.connect(other).judgeWithHand(0, Hand.Rock, correctCommitment)
    ).to.be.rejectedWith("Invalid judger");

    await expect(
      gameContract
        .connect(player)
        .judgeWithHand(0, Hand.Paper, correctCommitment)
    ).to.be.rejectedWith("Owner hand is not same with saved one");
  });

  it("Receive ETH emit test", async function () {
    const tx = await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });
    await tx.wait();

    currentGameID = await gameContract.currentGameID();
    const gameInfo = await gameContract.gameList(currentGameID.sub(1));
    expect(gameInfo.status).to.equal(1); // 1 represents INITIALIZED status
    expect(currentGameID).to.equal(1);
  });

  it("Receive ETH emit test", async function () {
    const tx = await gameContract
      .connect(owner)
      .initializeGame(ownerHandHashRock, { value: initialParticipationFee });

    const txResponse = await owner.sendTransaction({
      to: gameContract.address,
      value: ethers.utils.parseEther("1.0"), // Sending 1 Ether
    });

    await expect(txResponse)
      .to.emit(gameContract, "Receive")
      .withArgs("receive");
  });
});
