import { gql } from 'graphql-request';

// Pool queries
export const GET_POOLS = gql`
  query GetPools(
    $first: Int
    $skip: Int
    $where: Pool_filter
    $orderBy: Pool_orderBy
    $orderDirection: OrderDirection
  ) {
    pools(
      first: $first
      skip: $skip
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      creator {
        id
        address
        isVerified
        verificationBonusPools
      }
      status
      entryFee
      maxPlayers
      currentPlayers
      prizePool
      currentRound
      winner {
        id
        address
      }
      prizeAmount
      createdAt
      activatedAt
      completedAt
      chainId
    }
  }
`;

export const GET_POOL = gql`
  query GetPool($id: ID!) {
    pool(id: $id) {
      id
      creator {
        id
        address
        isVerified
        totalPoolsCreated
        completedPools
      }
      status
      entryFee
      maxPlayers
      currentPlayers
      prizePool
      currentRound
      winner {
        id
        address
        totalEarnings
        totalPoolsWon
      }
      prizeAmount
      createdAt
      activatedAt
      completedAt
      createdAtBlock
      activatedAtBlock
      completedAtBlock
      chainId
      players {
        id
        player {
          id
          address
        }
        isEliminated
        hasWon
        joinedAt
        entryFeePaid
      }
      rounds {
        id
        roundNumber
        winningChoice
        eliminatedCount
        remainingCount
        resolvedAt
        headsCount
        tailsCount
      }
    }
  }
`;

export const GET_ACTIVE_POOLS = gql`
  query GetActivePools($chainId: Int) {
    pools(
      where: {
        status: ACTIVE
        chainId: $chainId
      }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      creator {
        id
        address
        isVerified
      }
      status
      entryFee
      maxPlayers
      currentPlayers
      prizePool
      currentRound
      createdAt
      chainId
    }
  }
`;

export const GET_OPEN_POOLS = gql`
  query GetOpenPools($chainId: Int) {
    pools(
      where: {
        status: OPENED
        chainId: $chainId
      }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      creator {
        id
        address
        isVerified
      }
      status
      entryFee
      maxPlayers
      currentPlayers
      prizePool
      createdAt
      chainId
    }
  }
`;

// Player queries
export const GET_PLAYER = gql`
  query GetPlayer($id: ID!) {
    player(id: $id) {
      id
      address
      totalPoolsJoined
      totalPoolsWon
      totalPoolsEliminated
      totalEarnings
      totalSpent
      firstJoinedAt
      lastActiveAt
      poolsJoined {
        id
        pool {
          id
          status
          entryFee
          prizeAmount
          createdAt
          completedAt
        }
        isEliminated
        hasWon
        joinedAt
        entryFeePaid
        prizeAmount
      }
    }
  }
`;

export const GET_PLAYER_POOLS = gql`
  query GetPlayerPools($playerAddress: String!) {
    playerPools(where: { player: $playerAddress }) {
      id
      pool {
        id
        status
        entryFee
        maxPlayers
        currentPlayers
        prizePool
        currentRound
        winner {
          id
          address
        }
        prizeAmount
        createdAt
        completedAt
        chainId
      }
      isEliminated
      hasWon
      eliminatedInRound
      joinedAt
      entryFeePaid
      prizeAmount
      prizeClaimed
    }
  }
`;

// Creator queries
export const GET_CREATOR = gql`
  query GetCreator($id: ID!) {
    creator(id: $id) {
      id
      address
      totalStaked
      totalEarned
      totalPoolsEligible
      totalPoolsCreated
      isVerified
      verifiedAt
      attestationId
      verificationBonusPools
      completedPools
      abandonedPools
      firstStakedAt
      lastActiveAt
      chainId
      pools {
        id
        status
        entryFee
        maxPlayers
        currentPlayers
        prizePool
        currentRound
        winner {
          id
          address
        }
        prizeAmount
        createdAt
        activatedAt
        completedAt
        chainId
      }
    }
  }
`;

export const GET_CREATOR_STATS = gql`
  query GetCreatorStats($address: String!) {
    creator(id: $address) {
      id
      address
      totalStaked
      totalEarned
      totalPoolsEligible
      totalPoolsCreated
      isVerified
      verificationBonusPools
      completedPools
      abandonedPools
      lastActiveAt
      chainId
    }
  }
`;

// Game rounds and choices queries
export const GET_POOL_ROUNDS = gql`
  query GetPoolRounds($poolId: String!) {
    gameRounds(
      where: { pool: $poolId }
      orderBy: roundNumber
      orderDirection: asc
    ) {
      id
      roundNumber
      winningChoice
      eliminatedCount
      remainingCount
      resolvedAt
      resolvedAtBlock
      headsCount
      tailsCount
      playerChoices {
        id
        player {
          id
          address
        }
        choice
        wasWinningChoice
        madeAt
      }
    }
  }
`;

export const GET_LATEST_ROUND_RESULT = gql`
  query GetLatestRoundResult($poolId: String!) {
    gameRounds(
      where: { pool: $poolId }
      orderBy: roundNumber
      orderDirection: desc
      first: 1
    ) {
      id
      roundNumber
      winningChoice
      eliminatedCount
      remainingCount
      resolvedAt
      headsCount
      tailsCount
      playerChoices {
        id
        player {
          id
          address
        }
        choice
        wasWinningChoice
      }
    }
  }
`;

export const GET_PLAYER_CHOICES = gql`
  query GetPlayerChoices($poolId: String!, $playerAddress: String!) {
    playerChoices(
      where: {
        pool: $poolId
        player: $playerAddress
      }
      orderBy: madeAt
      orderDirection: asc
    ) {
      id
      choice
      wasWinningChoice
      madeAt
      round {
        id
        roundNumber
        winningChoice
        resolvedAt
      }
    }
  }
`;

// System statistics
export const GET_SYSTEM_STATS = gql`
  query GetSystemStats {
    systemStats(id: "system") {
      id
      totalPoolsCreated
      totalPoolsActive
      totalPoolsCompleted
      totalPoolsAbandoned
      totalPlayers
      totalPlayerJoins
      totalVolumeProcessed
      totalPrizesAwarded
      totalCreatorRewards
      totalStaked
      totalProjectPool
      lastUpdatedAt
    }
  }
`;

export const GET_NETWORK_STATS = gql`
  query GetNetworkStats($chainId: String!) {
    networkStats(id: $chainId) {
      id
      chainId
      totalPools
      activePools
      completedPools
      totalVolume
      totalPrizes
      totalStaked
      lastUpdatedAt
    }
  }
`;

// Search and filter queries
export const SEARCH_POOLS = gql`
  query SearchPools(
    $searchText: String!
    $status: PoolStatus
    $chainId: Int
    $first: Int = 20
  ) {
    pools(
      where: {
        or: [
          { id_contains: $searchText }
          { creator_contains: $searchText }
        ]
        status: $status
        chainId: $chainId
      }
      first: $first
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      creator {
        id
        address
        isVerified
      }
      status
      entryFee
      maxPlayers
      currentPlayers
      prizePool
      currentRound
      createdAt
      chainId
    }
  }
`;

export const GET_TOP_PLAYERS = gql`
  query GetTopPlayers($first: Int = 10, $chainId: Int) {
    players(
      first: $first
      orderBy: totalEarnings
      orderDirection: desc
      where: {
        totalPoolsWon_gt: 0
      }
    ) {
      id
      address
      totalPoolsJoined
      totalPoolsWon
      totalEarnings
      totalSpent
      lastActiveAt
    }
  }
`;

export const GET_TOP_CREATORS = gql`
  query GetTopCreators($first: Int = 10, $chainId: Int) {
    creators(
      first: $first
      orderBy: totalEarned
      orderDirection: desc
      where: {
        totalPoolsCreated_gt: 0
        chainId: $chainId
      }
    ) {
      id
      address
      totalStaked
      totalEarned
      totalPoolsCreated
      completedPools
      isVerified
      lastActiveAt
    }
  }
`;