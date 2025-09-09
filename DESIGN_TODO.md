# CoinToss Game - Design TODO

## 🎯 Project Overview
Design a complete UI/UX for the CoinToss minority-wins elimination game built on CELO blockchain with Farcaster Frame integration.

## 📋 Design Todos

### 1. 🏠 HOME & LANDING PAGES
- [ ] **Landing Page Redesign**
  - [ ] Hero section with game explanation
  - [ ] "How to Play" section with animated examples
  - [ ] Recent games statistics
  - [ ] Call-to-action buttons (Create Pool, Join Game)
  - [ ] Social proof elements
  
- [ ] **Dashboard/Home Page (Authenticated Users)**
  - [ ] User stats overview (games played, won, earnings)
  - [ ] Quick actions panel (Create Pool, Browse Games)
  - [ ] Active games section
  - [ ] Game history widget
  - [ ] Leaderboard preview

### 2. 🎮 GAME CORE PAGES

#### Pool Management
- [ ] **Pool Browser/Lobby**
  - [ ] Active pools grid/list view
  - [ ] Pool filtering (entry fee, max players, status)
  - [ ] Pool search functionality
  - [ ] Pool card design with key info
  - [ ] Real-time player count updates
  
- [ ] **Pool Details Page**
  - [ ] Pool information panel
  - [ ] Current players list with avatars
  - [ ] Join pool interface
  - [ ] Pool creator info
  - [ ] Entry requirements display
  - [ ] Pool status indicators

- [ ] **Create Pool Page**
  - [ ] Pool configuration form
  - [ ] Entry fee selector
  - [ ] Max players picker
  - [ ] Preview panel
  - [ ] Staking requirement display
  - [ ] Gas estimation

#### Pool Creator Flow
- [ ] **Staking Interface**
  - [ ] Stake amount selector (5-50 CELO)
  - [ ] Pools calculation display
  - [ ] Staking form with validation
  - [ ] Transaction confirmation
  - [ ] Penalty warning display

- [ ] **Creator Dashboard**
  - [ ] Created pools overview
  - [ ] Active/completed pools stats
  - [ ] Creator rewards summary
  - [ ] Pool performance metrics
  - [ ] Unstaking interface with warnings

#### Gameplay Experience
- [ ] **Game Room/Arena**
  - [ ] Round information header
  - [ ] Remaining players grid
  - [ ] Choice selection interface (HEADS/TAILS)
  - [ ] Timer/countdown display
  - [ ] Player choice indicators (without revealing choices)
  - [ ] Round history sidebar

- [ ] **Round Results Page**
  - [ ] Round outcome display
  - [ ] Eliminated players visualization
  - [ ] Surviving players list
  - [ ] Choice distribution chart
  - [ ] Next round countdown
  - [ ] Minority/majority explanation

- [ ] **Game Completion**
  - [ ] Winner announcement
  - [ ] Prize amount display
  - [ ] Game summary statistics
  - [ ] Prize claiming interface
  - [ ] Share results functionality

### 3. 👤 USER MANAGEMENT

- [ ] **Profile Page**
  - [ ] User stats dashboard
  - [ ] Game history table
  - [ ] Achievements/badges
  - [ ] Earnings summary
  - [ ] Settings panel

- [ ] **Wallet Integration**
  - [ ] Wallet connection states
  - [ ] Balance display
  - [ ] Transaction history
  - [ ] Network status indicator
  - [ ] Disconnect functionality

### 4. 📊 ANALYTICS & MONITORING

- [ ] **Statistics Page**
  - [ ] Global game statistics
  - [ ] Popular pool configurations
  - [ ] Player performance metrics
  - [ ] Prize distribution charts
  - [ ] Activity timeline

- [ ] **Leaderboard**
  - [ ] Top players ranking
  - [ ] Multiple ranking categories
  - [ ] Time period filters
  - [ ] Player profile previews
  - [ ] Achievement highlights

### 5. 🎨 UI COMPONENTS LIBRARY

#### Game-Specific Components
- [ ] **Pool Card Component**
  - [ ] Entry fee badge
  - [ ] Player count indicator
  - [ ] Status badges (Open, Active, Full)
  - [ ] Creator avatar and info
  - [ ] Join button with states

- [ ] **Player Avatar Grid**
  - [ ] Player grid layout
  - [ ] Elimination animations
  - [ ] Choice status indicators
  - [ ] Hoverable player info

- [ ] **Game Progress Indicator**
  - [ ] Round counter
  - [ ] Player elimination progress bar
  - [ ] Prize pool display
  - [ ] Time remaining indicator

- [ ] **Choice Selection Interface**
  - [ ] HEADS/TAILS buttons
  - [ ] Selection confirmation
  - [ ] Disabled states
  - [ ] Visual feedback

#### Financial Components
- [ ] **Staking Calculator**
  - [ ] CELO amount input
  - [ ] Pool count calculation
  - [ ] Visual slider interface
  - [ ] Penalty calculator

- [ ] **Transaction Components**
  - [ ] Transaction progress modal
  - [ ] Gas estimation display
  - [ ] Success/failure states
  - [ ] Receipt display

#### Data Visualization
- [ ] **Round Results Chart**
  - [ ] HEADS vs TAILS distribution
  - [ ] Animated result reveal
  - [ ] Minority highlight
  - [ ] Historical round comparison

- [ ] **Game Statistics Cards**
  - [ ] Win rate displays
  - [ ] Earnings summaries
  - [ ] Game participation stats
  - [ ] Performance trends

### 6. 📱 RESPONSIVE & MOBILE

- [ ] **Mobile-First Design**
  - [ ] Touch-optimized choice selection
  - [ ] Swipe gestures for navigation
  - [ ] Mobile game room layout
  - [ ] Responsive pool browser

- [ ] **Farcaster Frame Optimization**
  - [ ] Frame-specific layouts
  - [ ] Miniapp navigation
  - [ ] Social sharing integration
  - [ ] Frame action buttons

### 7. 🎭 UX ENHANCEMENTS

#### Animations & Micro-interactions
- [ ] **Loading States**
  - [ ] Skeleton screens for all pages
  - [ ] Loading animations
  - [ ] Progress indicators
  - [ ] Shimmer effects

- [ ] **Game Animations**
  - [ ] Coin flip animation
  - [ ] Player elimination effects
  - [ ] Round transition animations
  - [ ] Victory celebrations

- [ ] **Feedback Systems**
  - [ ] Toast notifications
  - [ ] Success/error messages
  - [ ] Confirmation dialogs
  - [ ] Progress feedback

#### Accessibility
- [ ] **A11y Compliance**
  - [ ] Screen reader support
  - [ ] Keyboard navigation
  - [ ] High contrast mode
  - [ ] Focus indicators

### 8. 🚨 ERROR & EDGE CASES

- [ ] **Error Pages**
  - [ ] 404 - Pool not found
  - [ ] Network connection errors
  - [ ] Transaction failed states
  - [ ] Insufficient balance warnings

- [ ] **Edge Case Handling**
  - [ ] Abandoned pool displays
  - [ ] Network switching prompts
  - [ ] Wallet disconnection handling
  - [ ] Game interruption recovery

### 9. 🎨 DESIGN SYSTEM

- [ ] **Color Palette**
  - [ ] Primary: Blue/Purple gradient theme
  - [ ] Secondary: Gold/Yellow for rewards
  - [ ] Success: Green for wins
  - [ ] Danger: Red for eliminations
  - [ ] Neutral: Grays for UI elements

- [ ] **Typography**
  - [ ] Heading hierarchy
  - [ ] Game-specific fonts
  - [ ] Readable body text
  - [ ] Monospace for addresses/amounts

- [ ] **Iconography**
  - [ ] Coin icons (heads/tails)
  - [ ] Status icons
  - [ ] Navigation icons
  - [ ] Action buttons

## 🏁 Implementation Priority

### Phase 1: Core Game Flow (High Priority)
1. Pool Browser → Pool Details → Join Pool
2. Game Room → Round Results → Game Completion
3. Basic responsive components

### Phase 2: Creator Experience (Medium Priority)
1. Staking Interface → Create Pool → Creator Dashboard
2. Pool management tools
3. Analytics and statistics

### Phase 3: Enhanced UX (Low Priority)
1. Advanced animations and micro-interactions
2. Social features and leaderboards
3. Accessibility improvements

## 📝 Design Notes
- Maintain consistency with existing Farcaster Frame design patterns
- Ensure all designs work within Frame constraints
- Focus on clear visual hierarchy for game state understanding
- Emphasize the minority-wins concept throughout the design
- Use color psychology to guide player behavior (red for danger, green for safety)

---
*This todo will be updated as we progress through the design implementation.*