# PLAYER_FLOWS.md — Turn Loop & State Machine Specifications

> **Status:** Active & Complete
> **Source-of-Truth:** `docs/scythe rules.pdf` (`SRC-001` pp. 10–29)

---

## 1. Match Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> LOBBY
    LOBBY --> SETUP : Host starts match (all ready)
    SETUP --> ACTIVE_TURN : Deterministic board & mat deal (Lowest player mat # goes first)
    
    state ACTIVE_TURN {
        [*] --> CHOOSE_SECTION
        CHOOSE_SECTION --> TOP_ROW_ACTION : Select valid Player Mat or Factory section
        TOP_ROW_ACTION --> COMBAT_CHECK : Execute or skip top action
        
        state COMBAT_CHECK {
            [*] --> CHECK_CONTESTED
            CHECK_CONTESTED --> COMBAT_COMMIT : Opponent character/mech shares territory
            CHECK_CONTESTED --> ENCOUNTER_CHECK : No combat
            
            state COMBAT_COMMIT {
                [*] --> SECRET_BIDS
                SECRET_BIDS --> SIMULTANEOUS_REVEAL : Both players submit dial + cards
                SIMULTANEOUS_REVEAL --> RESOLVE_COMBAT : Compare totals (attacker wins ties)
                RESOLVE_COMBAT --> CHECK_MORE_COMBATS
                CHECK_MORE_COMBATS --> COMBAT_COMMIT : More combats pending
                CHECK_MORE_COMBATS --> [*] : All combats resolved
            }
        }
        
        COMBAT_CHECK --> ENCOUNTER_CHECK
        state ENCOUNTER_CHECK {
            [*] --> TRIGGER_ENCOUNTER : Character on encounter hex
            TRIGGER_ENCOUNTER --> SUBMIT_CHOICE : Draw card, pick option (Polania up to 2)
            SUBMIT_CHOICE --> [*]
            [*] --> [*] : No encounter
        }
        
        ENCOUNTER_CHECK --> FACTORY_CHECK
        state FACTORY_CHECK {
            [*] --> CLAIM_FACTORY_CARD : Character on Factory for 1st time
            CLAIM_FACTORY_CARD --> [*] : Select 1 card from pool
            [*] --> [*] : Not on Factory or already claimed
        }
        
        FACTORY_CHECK --> BOTTOM_ROW_ACTION
        BOTTOM_ROW_ACTION --> RECRUIT_BONUS_CHECK : Execute or skip bottom action
        
        state RECRUIT_BONUS_CHECK {
            [*] --> DISTRIBUTE_NEIGHBOR_BONUSES : Active player, then Left neighbor, then Right neighbor
            DISTRIBUTE_NEIGHBOR_BONUSES --> [*]
        }
        
        RECRUIT_BONUS_CHECK --> CHECK_TRIUMPH_TRACK
        state CHECK_TRIUMPH_TRACK {
            [*] --> CHECK_6TH_STAR
            CHECK_6TH_STAR --> GAME_END : 6th star placed by any player
            CHECK_6TH_STAR --> [*] : Less than 6 stars
        }
    }
    
    ACTIVE_TURN --> ACTIVE_TURN : Advance turn clockwise
    ACTIVE_TURN --> GAME_END : 6th star placed
    GAME_END --> FINAL_SCORING : Settle board, evaluate coins & tie-breakers
    FINAL_SCORING --> COMPLETED : Display victory breakdown
    COMPLETED --> [*]
```

---

## 2. Granular Step-by-Step Execution Sequence

### Phase 1: Section Selection (`SRC-001` p. 10)
1. Verify it is the client's seat's active turn.
2. Verify selected section is valid:
   - Must be one of the 4 sections on the player's mat, or their claimed Factory card.
   - **No-Repeat Invariant**: Cannot be the same section selected on the immediately preceding turn, **unless** the player is **Rusviet** (`Relentless` ability, `SRC-001` p. 21).
   - If player has no legal moves and no resources/coins to take any action, allow a "dead turn" where the action token moves to another section without actions taken (`SRC-001` p. 13).

### Phase 2: Top-Row Action (`SRC-001` pp. 11–13)
The player may optionally take the top-row action of the chosen section:
- **Move**:
  - Move up to 2 different units (or 1 unit up to twice if Factory action).
  - Mechs may transport workers and resources.
  - Character/mech moving into enemy worker territory halts movement; enemy workers retreat to home base; attacker loses 1 popularity per retreating worker (`SRC-001` p. 11, 31). Polania (`Camaraderie`) loses 0 popularity.
  - Character/mech moving into enemy mech/character territory halts movement and flags territory for combat.
- **Produce**:
  - Pay exposed cost (power, popularity, coins depending on exposed worker slots).
  - Select up to 2 different controlled territories (or +1 bonus territory if Mill built).
  - Each worker produces 1 resource of that territory's biome (or 1 worker on village).
- **Trade**:
  - Pay $1.
  - Gain 2 resources of choice on a territory containing a worker, OR gain 1 popularity.
  - If Armory is built: also gain +1 power (`SRC-001` p. 18).
- **Bolster**:
  - Pay $1.
  - Gain 2 power on Power Track, OR draw 1 combat card.
  - If Monument is built: also gain +1 popularity (`SRC-001` p. 18).

### Phase 3: Movement Aftermath & Combat (`SRC-001` pp. 22–23)
1. **Combat Order**: If multiple combats were initiated, active player chooses resolution order.
2. **Combat Execution**:
   - Attacker abilities trigger first (e.g. Saxony *Disarm*, Nordic *Artillery*, Crimea *Scout*).
   - Both players secretly choose power on dial (0 up to $\min(\text{power}, 7)$).
   - Both players optionally tuck up to 1 combat card per participating combat unit (Rusviet *People's Army* allows +1 card if $\ge 1$ worker present).
   - Both choices submitted to server.
   - **Simultaneous Reveal**: Compare $(\text{Dial Power} + \sum\text{Cards})$.
   - **Winner**: Highest total power wins. Attacker wins ties!
   - Winner spends dial power, discards cards, gains/retains territory & resources, places Combat Star on Triumph Track (max 2 stars, unless Saxony *Dominate*).
   - Winner loses 1 popularity per enemy worker forced to retreat (unless Polania *Camaraderie*).
   - Loser spends dial power, discards cards, retreats all units to home base. If loser revealed $\ge 1$ power, draws 1 combat card as consolation.
   - **6th Star Game End Interrupt**: If winner's 6th star is placed, game immediately ends; any units moved to initiate remaining pending combats retreat back to their origin (`SRC-001` p. 23).

### Phase 4: Encounters & Factory Claim (`SRC-001` pp. 24–25)
1. If character is on an encounter token hex (and no enemy units remain):
   - Discard encounter token.
   - Draw top encounter card.
   - Present 3 options. Player selects 1 (Polania *Meander* can select up to 2).
   - Pay cost, receive benefits on that hex. Discard card to bottom of deck.
2. If character is on the Factory for the first time:
   - Draw available Factory cards ($N_{players} + 1 - \text{prior visitors}$).
   - Player selects 1 card permanently; return remaining to board.

### Phase 5: Bottom-Row Action (`SRC-001` pp. 14–20)
The player may optionally take the bottom-row action of the chosen section:
- **Upgrade**: Pay oil cost $\to$ Move tech cube from green benefit box to red cost box $\to$ Gain coin reward.
- **Deploy**: Pay metal cost $\to$ Place mech on territory with a worker $\to$ Unlock mech ability $\to$ Gain coin reward.
- **Build**: Pay wood cost $\to$ Place structure on controlled territory without existing structure $\to$ Unlock ongoing top-action bonus $\to$ Gain coin reward.
- **Enlist**: Pay food cost $\to$ Move recruit token to open Faction Mat slot $\to$ Gain immediate one-time bonus $\to$ Unlock ongoing recruit neighbor bonus $\to$ Gain coin reward.

### Phase 6: Recruit Ongoing Neighbor Bonuses (`SRC-001` p. 20)
Whenever a bottom-row action is taken:
- Active player checks if their recruit for this action is unlocked $\to$ gain bonus.
- Player to immediate left checks if recruit unlocked $\to$ gain bonus.
- Player to immediate right checks if recruit unlocked $\to$ gain bonus.
- *Order of resolution*: Active $\to$ Left $\to$ Right. If a player reaches 6 stars, game ends immediately.

### Phase 7: Triumph Track & End Turn (`SRC-001` p. 27–28)
- Check all 9 star categories. If an unachieved category is fulfilled, place star token on Triumph Track.
- If any player has 6 stars: **Game Ends Immediately**. Proceed to Final Scoring.
- Otherwise: Advance active turn clockwise to next player.
