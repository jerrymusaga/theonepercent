import assert from "assert";
import { TestHelpers } from "generated";
const { MockDb, CoinToss } = TestHelpers;

describe("CoinToss contract PoolCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for CoinToss contract PoolCreated event
  const event = CoinToss.PoolCreated.createMockEvent({
    poolId: 1n,
    creator: "0x1234567890123456789012345678901234567890",
    entryFee: 1000000000000000000n, // 1 ETH in wei
    maxPlayers: 10n
  });

  it("PoolCreated event creates correct entities", async () => {
    // Processing the event
    const mockDbUpdated = await CoinToss.PoolCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entities from the mock database
    const poolId = event.params.poolId.toString();
    const creatorId = event.params.creator.toLowerCase();

    const actualPool = mockDbUpdated.entities.Pool.get(poolId);
    const actualCreator = mockDbUpdated.entities.Creator.get(creatorId);
    const actualEvent = mockDbUpdated.entities.Event.get(`${poolId}-created`);

    // Basic assertions
    assert(actualPool !== undefined, "Pool entity should be created");
    assert(actualCreator !== undefined, "Creator entity should be created");
    assert(actualEvent !== undefined, "Event entity should be created");

    // Pool assertions
    assert.strictEqual(actualPool!.id, poolId);
    assert.strictEqual(actualPool!.creator_id, creatorId);
    assert.strictEqual(actualPool!.status, "WAITING_FOR_PLAYERS");
    assert.strictEqual(actualPool!.entryFee, event.params.entryFee);
    assert.strictEqual(actualPool!.maxPlayers, Number(event.params.maxPlayers));

    // Creator assertions
    assert.strictEqual(actualCreator!.id, creatorId);
    assert.strictEqual(actualCreator!.address, event.params.creator);
    assert.strictEqual(actualCreator!.totalPoolsCreated, 1);

    // Event assertions
    assert.strictEqual(actualEvent!.eventType, "POOL_CREATED");
    assert.strictEqual(actualEvent!.pool_id, poolId);
    assert.strictEqual(actualEvent!.creator_id, creatorId);
  });
});
