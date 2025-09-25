import assert from "assert";
import { TestHelpers } from "generated";

const { MockDb, CoinToss, Addresses } = TestHelpers;

describe("CoinToss indexer tests", () => {
  it("A PoolCreated event creates a Pool entity", async () => {
    // Initializing the mock database
    const mockDbInitial = MockDb.createMockDb();

    // Initializing values for mock event
    const creatorAddress = Addresses.defaultAddress;
    const poolId = 1n;
    const entryFee = 1000000000000000000n; // 1 CELO in wei
    const maxPlayers = 10n;

    // Creating a mock event
    const mockPoolCreatedEvent = CoinToss.PoolCreated.createMockEvent({
      poolId: poolId,
      creator: creatorAddress,
      entryFee: entryFee,
      maxPlayers: maxPlayers,
    });

    // Processing the mock event on the mock database
    const updatedMockDb = await CoinToss.PoolCreated.processEvent({
      event: mockPoolCreatedEvent,
      mockDb: mockDbInitial,
    });

    // Getting the pool entity from the mock database
    const actualPoolEntity = updatedMockDb.entities.Pool.get(poolId.toString());

    // Basic assertions about the created pool
    assert.equal(actualPoolEntity?.id, poolId.toString());
    assert.equal(actualPoolEntity?.creator, creatorAddress);
    assert.equal(actualPoolEntity?.entryFee, entryFee);
    assert.equal(actualPoolEntity?.maxPlayers, Number(maxPlayers));
    assert.equal(actualPoolEntity?.currentPlayers, 0);
  });

  it("A PlayerJoined event updates the pool and creates player entities", async () => {
    // Initializing the mock database with a pool
    const mockDbInitial = MockDb.createMockDb();
    const creatorAddress = Addresses.defaultAddress;
    const playerAddress = Addresses.mockAddresses[1];
    const poolId = 1n;
    const entryFee = 1000000000000000000n;
    const maxPlayers = 10n;

    // First create a pool
    const mockPoolCreatedEvent = CoinToss.PoolCreated.createMockEvent({
      poolId: poolId,
      creator: creatorAddress,
      entryFee: entryFee,
      maxPlayers: maxPlayers,
    });

    const mockDbWithPool = await CoinToss.PoolCreated.processEvent({
      event: mockPoolCreatedEvent,
      mockDb: mockDbInitial,
    });

    // Then add a player
    const mockPlayerJoinedEvent = CoinToss.PlayerJoined.createMockEvent({
      poolId: poolId,
      player: playerAddress,
      currentPlayers: 1n,
      maxPlayers: maxPlayers,
    });

    const updatedMockDb = await CoinToss.PlayerJoined.processEvent({
      event: mockPlayerJoinedEvent,
      mockDb: mockDbWithPool,
    });

    // Check that pool was updated
    const updatedPool = updatedMockDb.entities.Pool.get(poolId.toString());
    assert.equal(updatedPool?.currentPlayers, 1);

    // Check that player was created
    const player = updatedMockDb.entities.Player.get(playerAddress);
    assert.equal(player?.address, playerAddress);
    assert.equal(player?.totalPoolsJoined, 1);
  });
});