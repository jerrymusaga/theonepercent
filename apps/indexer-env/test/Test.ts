import assert from "assert";
import { 
  TestHelpers,
  CoinToss_CreatorRewardClaimed
} from "generated";
const { MockDb, CoinToss } = TestHelpers;

describe("CoinToss contract CreatorRewardClaimed event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for CoinToss contract CreatorRewardClaimed event
  const event = CoinToss.CreatorRewardClaimed.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("CoinToss_CreatorRewardClaimed is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await CoinToss.CreatorRewardClaimed.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualCoinTossCreatorRewardClaimed = mockDbUpdated.entities.CoinToss_CreatorRewardClaimed.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedCoinTossCreatorRewardClaimed: CoinToss_CreatorRewardClaimed = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      creator: event.params.creator,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualCoinTossCreatorRewardClaimed, expectedCoinTossCreatorRewardClaimed, "Actual CoinTossCreatorRewardClaimed should be the same as the expectedCoinTossCreatorRewardClaimed");
  });
});
